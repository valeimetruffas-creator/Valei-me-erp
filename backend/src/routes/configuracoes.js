import { buildSimpleRoutes } from "./simples.js";
import { configuracaoController } from "../controllers/simpleControllers.js";
import { configuracaoCreateSchema, configuracaoUpdateSchema } from "../validators/simpleSchemas.js";

const router = buildSimpleRoutes(configuracaoController, configuracaoCreateSchema, configuracaoUpdateSchema);
export default router;
