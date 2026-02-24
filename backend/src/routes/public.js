import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";
import {
  createPublicPedido,
  listPublicCardapio,
  listPublicProdutos,
} from "../controllers/publicController.js";
import { pedidoCreateSchema } from "../validators/pedidoSchemas.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();
const empresaQuerySchema = z.object({ empresaSlug: z.string().min(2) });

router.get("/produtos", validate(empresaQuerySchema, "query"), asyncHandler(listPublicProdutos));
router.get("/cardapio", validate(empresaQuerySchema, "query"), asyncHandler(listPublicCardapio));
router.post("/pedidos", validate(empresaQuerySchema, "query"), validate(pedidoCreateSchema), asyncHandler(createPublicPedido));

export default router;
