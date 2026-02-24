import crypto from "node:crypto";
import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ifoodQueueService } from "../integrations/ifood/ifoodQueueService.js";
import { ifoodConfigRepository } from "../integrations/ifood/ifoodConfigRepository.js";
import { ifoodOrderService } from "../integrations/ifood/ifoodOrderService.js";
import { env } from "../config/env.js";

const router = Router();

router.post(
  "/test",
  asyncHandler(async (req, res) => {
    const providedKey = String(req.headers["x-ifood-test-key"] || "").trim();

    if (env.nodeEnv === "production" && env.ifoodWebhookSecret && providedKey !== env.ifoodWebhookSecret) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado ao endpoint de teste",
      });
    }

    const payload = req.body?.payload && typeof req.body.payload === "object"
      ? req.body.payload
      : req.body;

    const merchantId = payload?.merchantId || payload?.merchantID || req.body?.merchantId || null;
    let empresaId = req.body?.empresaId || payload?.empresaId || null;

    if (!empresaId && merchantId) {
      const config = await ifoodConfigRepository.getByMerchantId(merchantId);
      empresaId = config?.empresaId || null;
    }

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "empresaId não resolvido. Informe merchantId válido ou empresaId no body.",
      });
    }

    const event = {
      id: payload?.id || `ifood-test-${Date.now()}`,
      type: payload?.type || "ORDER_PLACED",
      orderId: payload?.orderId || `ORDER-TEST-${Date.now()}`,
      merchantId: merchantId || payload?.merchantId || null,
      createdAt: payload?.createdAt || new Date().toISOString(),
      ...payload,
      empresaId,
    };

    const queueResult = await ifoodQueueService.enqueue(empresaId, event);

    if (!queueResult.enqueued) {
      return res.json({
        success: true,
        data: {
          accepted: true,
          duplicated: true,
          eventId: queueResult.eventId,
          empresaId,
          message: "Evento já estava na fila",
        },
      });
    }

    await ifoodOrderService.logIntegracao({
      empresaId,
      eventId: queueResult.eventId,
      status: "test_received",
      erro: null,
      payload: event,
    });

    const processNow = Boolean(req.body?.processNow);
    let processing = { attempted: false };

    if (processNow) {
      const doc = await ifoodQueueService.collection().doc(queueResult.eventId).get();
      if (doc.exists) {
        const result = await ifoodQueueService.processItem({ id: doc.id, ...doc.data() }, `manual-test-${crypto.randomUUID()}`);
        processing = { attempted: true, ...result };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        accepted: true,
        eventId: queueResult.eventId,
        empresaId,
        processNow,
        processing,
      },
    });
  }),
);

export default router;
