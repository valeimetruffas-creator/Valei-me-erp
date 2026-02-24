import { Router } from "express";
import { createPedido, listPedidos, updateStatusPedido } from "../controllers/pedidoController.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema, paginationSchema } from "../validators/commonSchemas.js";
import { pedidoCreateSchema, pedidoUpdateStatusSchema } from "../validators/pedidoSchemas.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { rateLimitByAuthEmpresa } from "../middlewares/empresaRateLimit.js";

const router = Router();

router.use(rateLimitByAuthEmpresa({ source: "api", route: "/api/pedidos" }));

router.get("/", validate(paginationSchema, "query"), asyncHandler(listPedidos));
router.post("/", validate(pedidoCreateSchema), asyncHandler(createPedido));
router.patch("/:id/status", validate(idParamSchema, "params"), validate(pedidoUpdateStatusSchema), asyncHandler(updateStatusPedido));

export default router;
