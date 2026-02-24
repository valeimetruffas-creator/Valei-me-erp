import { Router } from "express";
import healthRouter from "./health.js";
import tenantRouter from "./tenant.js";
import produtosRouter from "./produtos.js";
import pedidosRouter from "./pedidos.js";
import estoqueRouter from "./estoque.js";
import clientesRouter from "./clientes.js";
import configuracoesRouter from "./configuracoes.js";
import publicRouter from "./public.js";
import ifoodRouter from "./ifood.js";
import ifoodApiRouter from "./ifoodApi.js";
import webhookRouter from "./webhook.js";
import adminIfoodRouter from "./adminIfood.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireTenant } from "../middlewares/tenantGuard.js";

const router = Router();

router.use(healthRouter);
router.use("/public", publicRouter);
router.use("/webhook", webhookRouter);

router.use("/tenant", requireAuth, requireTenant, tenantRouter);
router.use("/produtos", requireAuth, requireTenant, produtosRouter);
router.use("/pedidos", requireAuth, requireTenant, pedidosRouter);
router.use("/estoque", requireAuth, requireTenant, estoqueRouter);
router.use("/clientes", requireAuth, requireTenant, clientesRouter);
router.use("/configuracoes", requireAuth, requireTenant, configuracoesRouter);
router.use("/ifood", requireAuth, requireTenant, ifoodApiRouter);
router.use("/integrations/ifood", requireAuth, requireTenant, ifoodRouter);
router.use("/admin", requireAuth, requireTenant, adminIfoodRouter);

export default router;
