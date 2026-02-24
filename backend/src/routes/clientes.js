import { buildSimpleRoutes } from "./simples.js";
import { clienteController } from "../controllers/simpleControllers.js";
import { clienteCreateSchema, clienteUpdateSchema } from "../validators/simpleSchemas.js";

const router = buildSimpleRoutes(clienteController, clienteCreateSchema, clienteUpdateSchema);
export default router;
