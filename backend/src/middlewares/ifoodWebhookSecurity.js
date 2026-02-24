import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const replayCache = new Map();
const REPLAY_TTL_MS = 10 * 60 * 1000;

function cleanupReplayCache() {
  const now = Date.now();
  for (const [key, expiresAt] of replayCache.entries()) {
    if (expiresAt <= now) {
      replayCache.delete(key);
    }
  }
}

function getEventsFromRequestBody(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.events)) return body.events;
  return body ? [body] : [];
}

function eventTimestamp(event) {
  const raw = event?.createdAt || event?.timestamp || event?.created_at || Date.now();
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : Date.now();
}

function eventId(event) {
  return String(event?.id || event?.eventId || event?.orderId || "").trim();
}

function validateSignature(rawBody, signatureHeader) {
  if (!env.ifoodWebhookSecret) return true;
  if (!rawBody || !signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", env.ifoodWebhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(String(signatureHeader), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function replayGuard(req, res, next) {
  cleanupReplayCache();

  const events = getEventsFromRequestBody(req.body);
  const now = Date.now();

  for (const event of events) {
    const id = eventId(event);
    if (!id) continue;

    const ts = eventTimestamp(event);
    if (Math.abs(now - ts) > REPLAY_TTL_MS) {
      logger.warn("ifood_webhook_replay_window_rejected", {
        eventId: id,
        timestamp: ts,
      });
      return res.status(401).json({ success: false, error: "Evento fora da janela permitida" });
    }

    const fingerprint = `${id}:${ts}`;
    if (replayCache.has(fingerprint)) {
      logger.warn("ifood_webhook_replay_detected", {
        eventId: id,
        timestamp: ts,
      });
      return res.status(409).json({ success: false, error: "Evento duplicado detectado (replay)" });
    }

    replayCache.set(fingerprint, now + REPLAY_TTL_MS);
  }

  return next();
}

function signatureGuard(req, res, next) {
  const signature = req.headers["x-ifood-signature"];
  const rawBody = req.rawBody || JSON.stringify(req.body || {});
  const valid = validateSignature(rawBody, signature);

  logger.info("ifood_webhook_signature_checked", {
    valid,
    hasSignature: Boolean(signature),
  });

  if (!valid) {
    logger.warn("ifood_webhook_signature_invalid", {
      hasRawBody: Boolean(rawBody),
      hasSignature: Boolean(signature),
    });
    return res.status(401).json({ success: false, error: "Assinatura de webhook inválida" });
  }

  return next();
}

export const ifoodWebhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: "Webhook rate limit excedido" },
});

export const ifoodWebhookSecurity = [signatureGuard, replayGuard];
