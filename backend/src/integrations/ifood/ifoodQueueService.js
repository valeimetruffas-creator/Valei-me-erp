import crypto from "node:crypto";
import admin from "firebase-admin";
import { getAdminDb } from "../../firebaseAdmin.js";
import { logger } from "../../config/logger.js";
import { ifoodConfigRepository } from "./ifoodConfigRepository.js";
import { ifoodOrderService } from "./ifoodOrderService.js";

const COLLECTION = "ifood_fila";
const LOCK_COLLECTION = "ifood_locks";
const METRICS_COLLECTION = "metrics_ifood_minute";
const MAX_ATTEMPTS = 5;
const WORKER_LIMIT = 25;
const LOCK_TTL_MS = 30_000;

function nowIso() {
  return new Date().toISOString();
}

function toDateFromIso(iso) {
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : Date.now();
}

function backoffMs(nextAttemptNumber) {
  const base = 15_000;
  return Math.min(10 * 60_000, Math.pow(2, Math.max(0, nextAttemptNumber - 1)) * base);
}

function normalizeEventId(event) {
  return String(event?.id || event?.eventId || `${event?.type || "UNKNOWN"}-${event?.orderId || crypto.randomUUID()}`);
}

function minuteBucketDate() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function toDateFromUnknown(value) {
  if (!value) {
    return new Date(0);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }
  return date;
}

class IfoodQueueService {
  collection() {
    return getAdminDb().collection(COLLECTION);
  }

  lockCollection() {
    return getAdminDb().collection(LOCK_COLLECTION);
  }

  metricsCollection() {
    return getAdminDb().collection(METRICS_COLLECTION);
  }

  metricsDocId(empresaId, minuteStart) {
    return `${empresaId}_${minuteStart.getTime()}`;
  }

  async getQueueSize(empresaId) {
    const snap = await this.collection()
      .where("empresaId", "==", empresaId)
      .where("status", "==", "pending")
      .count()
      .get();

    return Number(snap.data().count || 0);
  }

  async getProcessingCount(empresaId) {
    const snap = await this.collection()
      .where("empresaId", "==", empresaId)
      .where("status", "==", "processing")
      .count()
      .get();

    return Number(snap.data().count || 0);
  }

  async updateMetrics({
    empresaId,
    processed = 0,
    errors = 0,
    retries = 0,
    queueSize,
  }) {
    if (!empresaId) {
      return;
    }

    const minute = minuteBucketDate();
    const resolvedQueueSize = Number.isFinite(Number(queueSize))
      ? Number(queueSize)
      : await this.getQueueSize(empresaId);
    const metricsRef = this.metricsCollection().doc(this.metricsDocId(empresaId, minute));
    const db = getAdminDb();

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(metricsRef);
      const createPayload = snap.exists
        ? {}
        : {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };

      tx.set(metricsRef, {
        ...createPayload,
        empresaId,
        minute,
        processed: admin.firestore.FieldValue.increment(Number(processed || 0)),
        errors: admin.firestore.FieldValue.increment(Number(errors || 0)),
        retries: admin.firestore.FieldValue.increment(Number(retries || 0)),
        queueSize: resolvedQueueSize,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  }

  async refreshQueueSizeMetrics() {
    const ativos = await ifoodConfigRepository.listAtivos();

    for (const config of ativos) {
      const empresaId = config?.empresaId;
      if (!empresaId) {
        continue;
      }

      const queueSize = await this.getQueueSize(empresaId);
      await this.updateMetrics({ empresaId, queueSize });
    }
  }

  async getMetricsByEmpresa(empresaId, { from, to }) {
    const snap = await this.metricsCollection()
      .where("empresaId", "==", empresaId)
      .where("minute", ">=", from)
      .where("minute", "<=", to)
      .get();

    const data = snap.docs
      .map((doc) => {
        const raw = doc.data() || {};
        return {
          id: doc.id,
          empresaId: raw.empresaId || empresaId,
          minute: toDateFromUnknown(raw.minute).toISOString(),
          processed: Number(raw.processed || 0),
          errors: Number(raw.errors || 0),
          retries: Number(raw.retries || 0),
          queueSize: Number(raw.queueSize || 0),
          createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : null,
          updatedAt: raw.updatedAt?.toDate ? raw.updatedAt.toDate().toISOString() : null,
        };
      })
      .sort((a, b) => toDateFromIso(a.minute) - toDateFromIso(b.minute));

    const totalProcessed = data.reduce((sum, item) => sum + item.processed, 0);
    const totalErrors = data.reduce((sum, item) => sum + item.errors, 0);
    const totalRetries = data.reduce((sum, item) => sum + item.retries, 0);
    const avgQueueSize = data.length
      ? Number((data.reduce((sum, item) => sum + item.queueSize, 0) / data.length).toFixed(2))
      : 0;
    const errorRate = totalProcessed > 0 ? Number((totalErrors / totalProcessed).toFixed(4)) : 0;

    return {
      totalProcessed,
      totalErrors,
      totalRetries,
      avgQueueSize,
      errorRate,
      data,
    };
  }

  async getStatusByEmpresa(empresaId) {
    const queueSize = await this.getQueueSize(empresaId);
    const processing = await this.getProcessingCount(empresaId);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = new Date();
    const metrics = await this.getMetricsByEmpresa(empresaId, { from: oneHourAgo, to: now });

    return {
      queueSize,
      processing,
      errorsLastHour: metrics.totalErrors,
      processedLastHour: metrics.totalProcessed,
    };
  }

  async enqueue(empresaId, event) {
    const eventId = normalizeEventId(event);
    const ref = this.collection().doc(eventId);
    const snap = await ref.get();

    if (snap.exists) {
      return { eventId, enqueued: false, duplicated: true };
    }

    await ref.set({
      id: eventId,
      eventId,
      empresaId: empresaId || null,
      merchantId: event?.merchantId || null,
      type: String(event?.type || "UNKNOWN"),
      orderId: event?.orderId || event?.id || null,
      status: "pending",
      attempts: 0,
      nextAttemptAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastError: null,
      payload: event,
    }, { merge: true });

    return { eventId, enqueued: true, duplicated: false };
  }

  async listProcessable() {
    const now = nowIso();
    const [pendingSnap, errorSnap] = await Promise.all([
      this.collection().where("status", "==", "pending").where("nextAttemptAt", "<=", now).limit(WORKER_LIMIT).get(),
      this.collection().where("status", "==", "error").where("nextAttemptAt", "<=", now).limit(WORKER_LIMIT).get(),
    ]);

    const items = [...pendingSnap.docs, ...errorSnap.docs]
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toDateFromIso(a.nextAttemptAt) - toDateFromIso(b.nextAttemptAt))
      .slice(0, WORKER_LIMIT);

    return items;
  }

  async listErrorsByEmpresa(empresaId, limit = 100) {
    const safeLimit = Math.max(1, Math.min(500, Number(limit || 100)));
    const snap = await this.collection()
      .where("empresaId", "==", empresaId)
      .where("status", "==", "error")
      .limit(safeLimit)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        empresaId: data.empresaId || null,
        eventId: data.eventId || data.id || doc.id,
        retries: Number(data.attempts || 0),
        lastError: data.lastError || null,
        createdAt: data.createdAt || null,
      };
    });
  }

  async retryById(empresaId, id) {
    const ref = this.collection().doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return { found: false, retried: false, reason: "not_found" };
    }

    const data = snap.data() || {};
    if (String(data.empresaId || "") !== String(empresaId || "")) {
      return { found: true, retried: false, reason: "forbidden" };
    }

    await ref.set({
      status: "pending",
      attempts: 0,
      exhausted: false,
      lastError: null,
      nextAttemptAt: nowIso(),
      updatedAt: nowIso(),
      processingStartedAt: null,
      processingWorkerId: null,
    }, { merge: true });

    await this.updateMetrics({ empresaId, retries: 1 });

    return {
      found: true,
      retried: true,
      id,
      empresaId,
      eventId: data.eventId || data.id || id,
    };
  }

  async claim(itemId, workerId) {
    const db = getAdminDb();
    const ref = this.collection().doc(itemId);

    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;

      const data = snap.data() || {};
      const status = String(data.status || "pending");
      const attempts = Number(data.attempts || 0);
      const nextAttemptAt = String(data.nextAttemptAt || nowIso());

      if (!["pending", "error"].includes(status)) {
        return null;
      }

      if (attempts >= MAX_ATTEMPTS) {
        return null;
      }

      if (toDateFromIso(nextAttemptAt) > Date.now()) {
        return null;
      }

      tx.set(ref, {
        status: "processing",
        processingStartedAt: nowIso(),
        processingWorkerId: workerId,
        updatedAt: nowIso(),
      }, { merge: true });

      return { id: itemId, ...data };
    });
  }

  async markDone(itemId, extra = {}) {
    await this.collection().doc(itemId).set({
      status: "done",
      doneAt: nowIso(),
      updatedAt: nowIso(),
      ...extra,
    }, { merge: true });
  }

  async markError(itemId, attempts, errorMessage) {
    const nextAttemptNumber = attempts + 1;
    const exhausted = nextAttemptNumber >= MAX_ATTEMPTS;

    await this.collection().doc(itemId).set({
      status: "error",
      attempts: nextAttemptNumber,
      lastError: errorMessage,
      exhausted,
      nextAttemptAt: exhausted ? null : new Date(Date.now() + backoffMs(nextAttemptNumber)).toISOString(),
      updatedAt: nowIso(),
    }, { merge: true });
  }

  async postpone(itemId, delayMs) {
    await this.collection().doc(itemId).set({
      status: "pending",
      nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
      updatedAt: nowIso(),
    }, { merge: true });
  }

  buildLockKey(empresaId, orderIdOrEventId) {
    if (!empresaId || !orderIdOrEventId) {
      return null;
    }

    return `${empresaId}:${orderIdOrEventId}`;
  }

  async acquireLock(key, workerId) {
    if (!key) {
      return { acquired: false, key: null, reason: "missing_key" };
    }

    const db = getAdminDb();
    const ref = this.lockCollection().doc(key);

    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const lockedAtIso = new Date(now).toISOString();
      const expiresAtIso = new Date(now + LOCK_TTL_MS).toISOString();

      if (snap.exists) {
        const data = snap.data() || {};
        const currentExpires = toDateFromIso(data.expiresAt || new Date(0).toISOString());
        if (currentExpires > now) {
          return { acquired: false, key, reason: "active" };
        }
      }

      tx.set(ref, {
        key,
        lockedAt: lockedAtIso,
        workerId,
        expiresAt: expiresAtIso,
      }, { merge: true });

      return { acquired: true, key, reason: "ok" };
    });
  }

  async releaseLock(key) {
    if (!key) {
      return;
    }

    await this.lockCollection().doc(key).delete();
  }

  async resolveEmpresaId(item) {
    if (item.empresaId) {
      return item.empresaId;
    }

    if (!item.merchantId) {
      return null;
    }

    const config = await ifoodConfigRepository.getByMerchantId(item.merchantId);
    return config?.empresaId || null;
  }

  async processItem(item, workerId) {
    const claimed = await this.claim(item.id, workerId);
    if (!claimed) {
      return { skipped: true };
    }

    let resolvedEmpresaId = claimed.empresaId || null;
    let eventId = normalizeEventId(claimed.payload || {});

    try {
      const empresaId = await this.resolveEmpresaId(claimed);
      if (!empresaId) {
        throw new Error("empresaId não resolvido para item da fila");
      }

      resolvedEmpresaId = empresaId;

      const event = claimed.payload || {};
      eventId = normalizeEventId(event);
      const orderId = event?.orderId || event?.id || claimed.orderId;
      const lockKey = this.buildLockKey(empresaId, orderId || eventId);

      const lockInfo = await this.acquireLock(lockKey, workerId);
      if (!lockInfo.acquired && lockInfo.reason === "active") {
        await this.postpone(claimed.id, 5000);
        await this.updateMetrics({ empresaId, retries: 1 });
        await ifoodOrderService.logIntegracao({
          tipo: "ifood_webhook",
          empresaId,
          eventId,
          status: "lock_active",
          erro: null,
          payload: event,
        });
        return { done: false, skippedLock: true };
      }

      if (!lockInfo.acquired) {
        await this.postpone(claimed.id, 5000);
        await this.updateMetrics({ empresaId, retries: 1 });
        await ifoodOrderService.logIntegracao({
          tipo: "ifood_webhook",
          empresaId,
          eventId,
          status: "lock_not_acquired",
          erro: "Não foi possível adquirir lock distribuído",
          payload: event,
        });
        return { done: false, skippedLock: true };
      }

      const start = Date.now();

      try {
        await ifoodOrderService.saveEvent(empresaId, event);

        await ifoodOrderService.logIntegracao({
          tipo: "ifood_webhook",
          empresaId,
          eventId,
          status: "processing",
          erro: null,
          payload: event,
        });

        const result = await ifoodOrderService.handleOrderEventByType(empresaId, event);
        const durationMs = Date.now() - start;

        await this.markDone(claimed.id, { empresaId, result: result || null, durationMs });
        await this.updateMetrics({ empresaId, processed: 1 });

        await ifoodOrderService.logIntegracao({
          tipo: "ifood_webhook",
          empresaId,
          eventId,
          status: "done",
          erro: null,
          durationMs,
          payload: event,
        });

        return { done: true };
      } finally {
        if (lockInfo.key) {
          await this.releaseLock(lockInfo.key);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = Number(claimed.attempts || 0);
      await this.markError(claimed.id, attempts, message);

      const nextAttemptNumber = attempts + 1;
      const exhausted = nextAttemptNumber >= MAX_ATTEMPTS;
      await this.updateMetrics({
        empresaId: resolvedEmpresaId,
        errors: 1,
        retries: exhausted ? 0 : 1,
      });

      await ifoodOrderService.logIntegracao({
        tipo: "ifood_webhook",
        empresaId: resolvedEmpresaId,
        eventId,
        status: "erro",
        erro: message,
        payload: claimed.payload || null,
      });

      logger.error("ifood_queue_process_failed", {
        itemId: claimed.id,
        attempts,
        workerId,
        error: message,
      });

      return { done: false, error: message };
    }
  }
}

export const ifoodQueueService = new IfoodQueueService();
