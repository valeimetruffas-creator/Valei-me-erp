import { Router } from "express";
import { createProduto, listProdutos, updateProduto } from "../controllers/produtoController.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/commonSchemas.js";
import { produtoCreateSchema, produtoUpdateSchema } from "../validators/produtoSchemas.js";
import { requireAdmin } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listProdutos));
router.post("/", requireAdmin, validate(produtoCreateSchema), asyncHandler(createProduto));
router.put("/:id", requireAdmin, validate(idParamSchema, "params"), validate(produtoUpdateSchema), asyncHandler(updateProduto));

export default router;
