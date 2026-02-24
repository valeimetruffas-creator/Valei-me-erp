import { getAdminDb } from "../firebaseAdmin.js";
import { logger } from "../config/logger.js";
import { ifoodConfigRepository } from "../integrations/ifood/ifoodConfigRepository.js";

const COLLECTION = "rate_limits";
const WINDOW_MS = 60_000;
const LIMIT = 100;

function nowTs() {
  return Date.now();
}

function nowIso() {
  return new Date().toISOString();
}

function extractWebhookEvents(body) {
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.events)) {
    return body.events;
  }

  return body ? [body] : [];
}

async function consumeRateLimit(empresaId, context) {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(String(empresaId));

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = nowTs();

    if (!snap.exists) {
      tx.set(ref, {
        empresaId,
        windowStart: now,
        count: 1,
        updatedAt: nowIso(),
      }, { merge: true });
      return { allowed: true, count: 1 };
    }

    const data = snap.data() || {};
    const windowStart = Number(data.windowStart || 0);
    const count = Number(data.count || 0);

    if (now - windowStart >= WINDOW_MS) {
      tx.set(ref, {
        empresaId,
        windowStart: now,
        count: 1,
        updatedAt: nowIso(),
      }, { merge: true });
      return { allowed: true, count: 1 };
    }

    if (count >= LIMIT) {
      logger.warn("empresa_rate_limit_exceeded", {
        empresaId,
        limit: LIMIT,
        windowMs: WINDOW_MS,
        route: context.route,
        source: context.source,
      });
      return { allowed: false, count };
    }

    const nextCount = count + 1;
    tx.set(ref, {
      empresaId,
      windowStart,
      count: nextCount,
      updatedAt: nowIso(),
    }, { merge: true });

    return { allowed: true, count: nextCount };
  });
}

export function rateLimitByAuthEmpresa({ source, route }) {
  return async function authEmpresaRateLimit(req, res, next) {
    const empresaId = req.authUser?.empresaId;

    if (!empresaId) {
      return res.status(403).json({ success: false, error: "empresaId não encontrado para rate limit" });
    }

    try {
      const result = await consumeRateLimit(empresaId, { source, route });
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: "Limite de requisições por empresa excedido (100/min)",
        });
      }

      return next();
    } catch (error) {
      logger.error("empresa_rate_limit_check_failed", {
        empresaId,
        route,
        source,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ success: false, error: "Falha ao validar rate limit" });
    }
  };
}

export function rateLimitByWebhookEmpresa({ route }) {
  return async function webhookEmpresaRateLimit(req, res, next) {
    try {
      const events = extractWebhookEvents(req.body);
      let empresaId = null;

      for (const event of events) {
        if (event?.empresaId) {
          empresaId = String(event.empresaId);
          break;
        }

        const merchantId = event?.merchantId || event?.merchantID;
        if (!merchantId) {
          continue;
        }

        const config = await ifoodConfigRepository.getByMerchantId(String(merchantId));
        if (config?.empresaId) {
          empresaId = String(config.empresaId);
          break;
        }
      }

      if (!empresaId) {
        logger.warn("empresa_rate_limit_webhook_empresa_not_resolved", {
          route,
          events: events.length,
        });
        return res.status(400).json({
          success: false,
          error: "empresaId não resolvido para rate limit do webhook",
        });
      }

      const result = await consumeRateLimit(empresaId, { source: "webhook", route });
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: "Limite de requisições por empresa excedido (100/min)",
        });
      }

      return next();
    } catch (error) {
      logger.error("empresa_rate_limit_webhook_failed", {
        route,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ success: false, error: "Falha ao validar rate limit do webhook" });
    }
  };
}
