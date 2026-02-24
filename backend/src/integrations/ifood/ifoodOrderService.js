import crypto from "node:crypto";
import { getAdminDb } from "../../firebaseAdmin.js";
import { pedidoService } from "../../services/pedidoService.js";
import { ifoodAuthService } from "./ifoodAuthService.js";
import { mapOrderToSystem, mapStatus } from "./ifoodMapper.js";
import { ifoodRequest } from "./ifoodHttpClient.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";

class IfoodOrderService {
  eventId(eventPayload) {
    return String(
      eventPayload?.id
      || eventPayload?.eventId
      || `${eventPayload?.type || "UNKNOWN"}-${eventPayload?.orderId || crypto.randomUUID()}`,
    );
  }

  async logIntegracao(payload) {
    const id = crypto.randomUUID();
    await getAdminDb().collection("logsIntegracao").doc(id).set({
      id,
      tipo: "ifood_webhook",
      criadoEm: new Date().toISOString(),
      ...payload,
    }, { merge: true });
  }

  async alertCritical({ empresaId, eventId, category, error, payload }) {
    await this.logIntegracao({
      tipo: "ifood_webhook",
      empresaId,
      eventId,
      status: "critical_error",
      erro: error,
      category,
      payload,
    });

    console.error("[IFoodCritical]", { empresaId, eventId, category, error });

    if (env.ifoodAlertWebhookUrl) {
      try {
        await fetch(env.ifoodAlertWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "ifood_integration",
            empresaId,
            eventId,
            category,
            error,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (alertError) {
        logger.error("ifood_critical_alert_webhook_failed", {
          empresaId,
          eventId,
          category,
          error: alertError instanceof Error ? alertError.message : String(alertError),
        });
      }
    }
  }

  async isEventProcessed(eventId) {
    const snap = await getAdminDb().collection("ifood_eventos_processados").doc(eventId).get();
    return snap.exists;
  }

  async markEventProcessed(eventId, empresaId, status, extra = {}) {
    await getAdminDb().collection("ifood_eventos_processados").doc(eventId).set({
      eventId,
      empresaId,
      status,
      processadoEm: new Date().toISOString(),
      ...extra,
    }, { merge: true });
  }

  async saveEvent(empresaId, eventPayload) {
    const id = this.eventId(eventPayload);
    await getAdminDb().collection("eventos_ifood").doc(id).set({
      ...eventPayload,
      id,
      empresaId,
      recebidoEm: new Date().toISOString(),
    }, { merge: true });

    await this.logIntegracao({
      empresaId,
      eventId: id,
      status: "recebido",
      erro: null,
      payload: eventPayload,
    });

    return id;
  }

  async fetchOrderDetails(empresaId, orderId) {
    const token = await ifoodAuthService.getAccessToken(empresaId);
    return ifoodRequest({
      method: "GET",
      path: `/orders/${orderId}`,
      token,
    });
  }

  async processIfoodOrder(empresaId, event) {
    const orderId = event?.orderId || event?.id;
    if (!orderId) {
      throw new Error("Evento iFood inválido: orderId ausente");
    }

    const eventId = this.eventId(event);
    if (await this.isEventProcessed(eventId)) {
      logger.info("ifood_event_already_processed", { empresaId, eventId, orderId });
      await this.logIntegracao({
        tipo: "ifood_webhook",
        empresaId,
        eventId,
        status: "duplicate_avoided",
        erro: null,
        payload: event,
      });
      return null;
    }

    let details;
    try {
      details = await this.fetchOrderDetails(empresaId, orderId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.alertCritical({ empresaId, eventId, category: "falha_ifood", error: message, payload: event });
      throw error;
    }
    const mapped = mapOrderToSystem(details);

    const pedido = await pedidoService.upsertFromIfood(empresaId, orderId, {
      ...mapped,
      ifoodOrderId: orderId,
      status: "confirmado",
      origem: "ifood",
    });

    try {
      await this.handleStockAndSale(empresaId, pedido);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.alertCritical({ empresaId, eventId, category: "falha_estoque", error: message, payload: event });
      throw error;
    }
    await this.markEventProcessed(eventId, empresaId, "processado", {
      orderId,
      pedidoId: pedido?.id || null,
    });

    try {
      await this.updateOrderStatus(empresaId, orderId, "confirmado");
    } catch (error) {
      logger.warn("ifood_status_sync_warn", {
        empresaId,
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info("ifood_order_processed", { empresaId, orderId, pedidoId: pedido.id });
    return pedido;
  }

  async getDashboardMetrics(empresaId) {
    const snap = await getAdminDb()
      .collection("logsIntegracao")
      .where("empresaId", "==", empresaId)
      .where("tipo", "==", "ifood_webhook")
      .limit(1000)
      .get();

    const logs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const pedidosRecebidos = logs.filter((log) => ["queued", "recebido"].includes(String(log.status))).length;
    const pedidosProcessados = logs.filter((log) => ["done", "processado", "confirmado", "cancelado"].includes(String(log.status))).length;
    const erros = logs.filter((log) => ["erro", "critical_error"].includes(String(log.status))).length;
    const duplicidadesEvitadas = logs.filter((log) => ["duplicated", "lock_active", "duplicate_avoided", "event_already_processed"].includes(String(log.status))).length;

    const durations = logs
      .map((log) => Number(log.durationMs || 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    const tempoMedioMs = durations.length
      ? Math.round(durations.reduce((acc, cur) => acc + cur, 0) / durations.length)
      : 0;

    return {
      pedidosRecebidos,
      pedidosProcessados,
      erros,
      tempoMedioMs,
      duplicidadesEvitadas,
      totalLogs: logs.length,
    };
  }

  async handleStockAndSale(empresaId, pedido) {
    if (!pedido) {
      return;
    }

    const db = getAdminDb();
    const itens = Array.isArray(pedido.itens) ? pedido.itens : [];

    for (const item of itens) {
      const produtoId = item?.produtoId;
      const quantidade = Number(item?.quantidade || 0);
      if (!produtoId || quantidade <= 0) continue;

      const produtoRef = db.collection("produtos").doc(produtoId);
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(produtoRef);
        if (!snap.exists) return;
        const data = snap.data() || {};
        const estoqueAtual = Number(data.estoqueUnidades || 0);
        transaction.set(produtoRef, {
          estoqueUnidades: Math.max(0, estoqueAtual - quantidade),
          atualizadoEm: new Date().toISOString(),
        }, { merge: true });
      });
    }

    await db.collection("vendas").doc(pedido.id).set({
      id: pedido.id,
      empresaId,
      pedidoId: pedido.id,
      origem: "ifood",
      total: Number(pedido.total || 0),
      itens,
      criadoEm: new Date().toISOString(),
      status: "confirmada",
    }, { merge: true });
  }

  async handleOrderEventByType(empresaId, event) {
    const type = String(event?.type || "");
    const orderId = event?.orderId || event?.id;
    const eventId = this.eventId(event);

    if (!orderId) {
      return null;
    }

    if (await this.isEventProcessed(eventId)) {
      return null;
    }

    if (type === "ORDER_CANCELLED") {
      await pedidoService.updateStatusByIfoodOrderId(empresaId, orderId, "cancelado");
      await this.markEventProcessed(eventId, empresaId, "cancelado", { orderId });
      await this.logIntegracao({ empresaId, eventId, status: "cancelado", erro: null, payload: event });
      return { orderId, status: "cancelado" };
    }

    if (type === "ORDER_CONFIRMED") {
      await pedidoService.updateStatusByIfoodOrderId(empresaId, orderId, "confirmado");
      await this.markEventProcessed(eventId, empresaId, "confirmado", { orderId });
      await this.logIntegracao({ empresaId, eventId, status: "confirmado", erro: null, payload: event });
      return { orderId, status: "confirmado" };
    }

    const pedido = await this.processIfoodOrder(empresaId, event);
    await this.logIntegracao({ empresaId, eventId, status: "processado", erro: null, payload: event });
    return pedido;
  }

  async updateOrderStatus(empresaId, orderId, statusInterno) {
    const action = mapStatus(statusInterno);
    if (!action) {
      throw new Error(`Status interno sem mapeamento iFood: ${statusInterno}`);
    }

    const token = await ifoodAuthService.getAccessToken(empresaId);
    const path = `/orders/${orderId}/${action}`;

    const response = await ifoodRequest({
      method: "POST",
      path,
      token,
      body: {},
    });

    logger.info("ifood_order_status_updated", { empresaId, orderId, statusInterno, action });
    return response;
  }

  async pollEvents(empresaId) {
    const token = await ifoodAuthService.getAccessToken(empresaId);
    const eventsResponse = await ifoodRequest({
      method: "GET",
      path: "/events:polling",
      token,
    });

    const events = Array.isArray(eventsResponse) ? eventsResponse : eventsResponse?.events || [];
    const processed = [];

    for (const event of events) {
      const eventType = String(event?.type || "");
      await this.saveEvent(empresaId, event);

      if (["ORDER_PLACED", "ORDER_CONFIRMED", "ORDER_CANCELLED"].includes(eventType)) {
        try {
          const pedido = await this.handleOrderEventByType(empresaId, event);
          processed.push({ eventType, orderId: event?.orderId || event?.id, pedidoId: pedido?.id || null });
        } catch (error) {
          logger.error("ifood_event_process_failed", {
            empresaId,
            eventType,
            orderId: event?.orderId || event?.id,
            error: error instanceof Error ? error.message : String(error),
          });
          await this.logIntegracao({
            empresaId,
            eventId: this.eventId(event),
            status: "erro",
            erro: error instanceof Error ? error.message : String(error),
            payload: event,
          });
        }
      }
    }

    return {
      totalEvents: events.length,
      processed,
    };
  }
}

export const ifoodOrderService = new IfoodOrderService();
