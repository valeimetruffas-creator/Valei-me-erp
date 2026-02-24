import { logger } from "../../config/logger.js";
import { ifoodOrderService } from "./ifoodOrderService.js";
import { ifoodQueueService } from "./ifoodQueueService.js";
import { ifoodConfigRepository } from "./ifoodConfigRepository.js";

export async function handleIfoodWebhook(req, res) {
  const startedAt = Date.now();
  const events = Array.isArray(req.body) ? req.body : req.body?.events || [req.body];
  let enqueued = 0;
  let skipped = 0;

  logger.info("ifood_webhook_received", {
    totalEventosRecebidos: events.length,
    ip: req.ip,
  });

  for (const event of events) {
    const eventId = ifoodOrderService.eventId(event);
    const merchantId = event?.merchantId || event?.merchantID || null;

    try {
      let empresaId = event?.empresaId || null;

      if (!empresaId && merchantId) {
        const config = await ifoodConfigRepository.getByMerchantId(merchantId);
        empresaId = config?.empresaId || null;
      }

      if (!empresaId) {
        skipped += 1;
        logger.warn("ifood_webhook_tenant_not_resolved", {
          eventId,
          merchantId,
        });

        await ifoodOrderService.logIntegracao({
          empresaId: null,
          eventId,
          status: "erro",
          erro: "empresaId não resolvido por merchantId",
          payload: event,
        });
        continue;
      }

      const queueResult = await ifoodQueueService.enqueue(empresaId, {
        ...event,
        empresaId,
      });
      if (queueResult.enqueued) {
        enqueued += 1;
      }

      logger.info("ifood_webhook_enqueued", {
        eventId,
        empresaId,
        merchantId,
        enqueued: queueResult.enqueued,
      });

      await ifoodOrderService.logIntegracao({
        empresaId,
        eventId,
        status: queueResult.enqueued ? "queued" : "duplicated",
        erro: null,
        payload: event,
      });
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      logger.error("ifood_webhook_enqueue_failed", {
        eventId,
        merchantId,
        latencyMs,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ success: false, error: "Falha ao persistir evento na fila" });
    }
  }

  const latencyMs = Date.now() - startedAt;
  logger.info("ifood_webhook_processed", {
    totalEventosRecebidos: events.length,
    totalEventosEnfileirados: enqueued,
    totalEventosIgnorados: skipped,
    latencyMs,
  });

  if (latencyMs > 1000) {
    logger.warn("ifood_webhook_slow_response", {
      latencyMs,
      totalEventosRecebidos: events.length,
    });
  }

  return res.status(200).json({
    success: true,
    accepted: true,
    totalEventosRecebidos: events.length,
    totalEventosEnfileirados: enqueued,
    totalEventosIgnorados: skipped,
    latencyMs,
  });
}
