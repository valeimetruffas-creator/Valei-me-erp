import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ifoodAuthService } from "../integrations/ifood/ifoodAuthService.js";
import { ifoodCatalogService } from "../integrations/ifood/ifoodCatalogService.js";
import { ifoodMerchantService } from "../integrations/ifood/ifoodMerchantService.js";
import { ifoodConfigRepository } from "../integrations/ifood/ifoodConfigRepository.js";
import { ifoodOrderService } from "../integrations/ifood/ifoodOrderService.js";

const router = Router();

const connectSchema = z.object({
  clientId: z.string().min(4),
  clientSecret: z.string().min(6),
  merchantId: z.string().optional(),
  ativo: z.boolean().optional(),
});

const syncCatalogSchema = z.object({
  merchantId: z.string().optional(),
});

const updateStatusSchema = z.object({
  orderId: z.string().min(2),
  status: z.enum(["confirmado", "preparando", "saiu_entrega"]),
});

const simulationSchema = z.object({
  tipo: z.enum(["pedido", "catalogo", "status"]),
});

const ifoodRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: "Muitas requisições para iFood. Tente novamente em instantes." },
});

router.use(ifoodRateLimit);

router.post(
  "/connect",
  requireAdmin,
  validate(connectSchema),
  asyncHandler(async (req, res) => {
    const empresaId = req.authUser.empresaId;
    const { clientId, clientSecret, merchantId, ativo } = req.body;

    await ifoodAuthService.connect(empresaId, clientId, clientSecret);

    if (merchantId) {
      await ifoodConfigRepository.updateMerchant(empresaId, merchantId);
    }

    if (typeof ativo === "boolean") {
      await ifoodConfigRepository.updateStatus(empresaId, ativo);
    }

    const merchants = await ifoodMerchantService.listMerchants(empresaId);
    const status = await ifoodConfigRepository.getByEmpresaId(empresaId);

    res.json({
      success: true,
      data: {
        conectado: true,
        empresaId,
        merchantId: status?.merchantId || merchantId || "",
        merchants,
        tokenExpiration: status?.tokenExpiration || null,
      },
    });
  }),
);

router.post(
  "/sync-catalog",
  requireAdmin,
  validate(syncCatalogSchema),
  asyncHandler(async (req, res) => {
    const empresaId = req.authUser.empresaId;
    const { merchantId } = req.body;

    if (merchantId) {
      await ifoodConfigRepository.updateMerchant(empresaId, merchantId);
    }

    const data = await ifoodCatalogService.syncCatalog(empresaId);
    res.json({ success: true, data });
  }),
);

router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const config = await ifoodConfigRepository.getByEmpresaId(req.authUser.empresaId);
    if (!config) {
      return res.json({ success: true, data: { conectado: false, ativo: false } });
    }

    const safe = {
      ...config,
      clientSecret: undefined,
      accessToken: undefined,
      clientSecretEnc: undefined,
      accessTokenEnc: undefined,
    };
    return res.json({
      success: true,
      data: {
        ...safe,
        conectado: Boolean(safe.clientId),
      },
    });
  }),
);

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const data = await ifoodOrderService.getDashboardMetrics(req.authUser.empresaId);
    return res.json({ success: true, data });
  }),
);

router.post(
  "/disconnect",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await ifoodAuthService.disconnect(req.authUser.empresaId);
    res.json({ success: true, data: { disconnected: true } });
  }),
);

router.post(
  "/update-order-status",
  requireAdmin,
  validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const { orderId, status } = req.body;
    const data = await ifoodOrderService.updateOrderStatus(req.authUser.empresaId, orderId, status);
    res.json({ success: true, data });
  }),
);

router.post(
  "/simulate",
  requireAdmin,
  validate(simulationSchema),
  asyncHandler(async (req, res) => {
    const empresaId = req.authUser.empresaId;
    const tipo = req.body.tipo;

    if (tipo === "catalogo") {
      const data = await ifoodCatalogService.syncCatalog(empresaId);
      return res.json({ success: true, data, simulation: true });
    }

    if (tipo === "status") {
      const mockOrderId = "SIMULATED_ORDER_ID";
      const data = await ifoodOrderService.updateOrderStatus(empresaId, mockOrderId, "confirmado");
      return res.json({ success: true, data, simulation: true });
    }

    const fakeEvent = {
      id: `sim-${Date.now()}`,
      type: "ORDER_PLACED",
      orderId: "SIMULATED_ORDER_ID",
    };

    await ifoodOrderService.saveEvent(empresaId, fakeEvent);
    return res.json({ success: true, data: { accepted: true, fakeEvent }, simulation: true });
  }),
);

export default router;
