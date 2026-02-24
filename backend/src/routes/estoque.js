import { buildSimpleRoutes } from "./simples.js";
import { estoqueController } from "../controllers/simpleControllers.js";
import { estoqueCreateSchema, estoqueUpdateSchema } from "../validators/simpleSchemas.js";

const router = buildSimpleRoutes(estoqueController, estoqueCreateSchema, estoqueUpdateSchema);
export default router;
