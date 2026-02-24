import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/commonSchemas.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export function buildSimpleRoutes(controller, createSchema, updateSchema) {
  const router = Router();

  router.get("/", asyncHandler(controller.list));
  router.post("/", validate(createSchema), asyncHandler(controller.create));
  router.put("/:id", validate(idParamSchema, "params"), validate(updateSchema), asyncHandler(controller.update));

  return router;
}
