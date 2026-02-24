import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requireAdmin } from "../middlewares/authMiddleware.js";
import { ifoodQueueService } from "../integrations/ifood/ifoodQueueService.js";
import { getIfoodCircuitStatus } from "../integrations/ifood/ifoodHttpClient.js";

const router = Router();

function parseDateParam(value, fallback) {
  if (!value) {
    return fallback;
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    const dateFromNumber = new Date(asNumber);
    if (!Number.isNaN(dateFromNumber.getTime())) {
      return dateFromNumber;
    }
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date;
}

router.get(
  "/ifood/errors",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const empresaId = req.authUser.empresaId;
    const data = await ifoodQueueService.listErrorsByEmpresa(empresaId);
    return res.json({ success: true, data });
  }),
);

router.get(
  "/ifood/metrics",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const empresaId = req.authUser.empresaId;
    const to = parseDateParam(req.query.to, new Date());
    const from = parseDateParam(req.query.from, new Date(to.getTime() - 60 * 60 * 1000));

    const metrics = await ifoodQueueService.getMetricsByEmpresa(empresaId, { from, to });
    return res.json({ success: true, ...metrics });
  }),
);

router.get(
  "/ifood/status",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const empresaId = req.authUser.empresaId;
    const status = await ifoodQueueService.getStatusByEmpresa(empresaId);
    const circuitStatus = getIfoodCircuitStatus();

    return res.json({
      success: true,
      queueSize: status.queueSize,
      processing: status.processing,
      errorsLastHour: status.errorsLastHour,
      processedLastHour: status.processedLastHour,
      circuitStatus,
    });
  }),
);

router.post(
  "/ifood/retry/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const empresaId = req.authUser.empresaId;
    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({ success: false, error: "id é obrigatório" });
    }

    const result = await ifoodQueueService.retryById(empresaId, id);

    if (!result.found) {
      return res.status(404).json({ success: false, error: "Item da fila não encontrado" });
    }

    if (!result.retried && result.reason === "forbidden") {
      return res.status(403).json({ success: false, error: "Item não pertence à empresa do usuário" });
    }

    return res.json({ success: true, data: result });
  }),
);

export default router;
