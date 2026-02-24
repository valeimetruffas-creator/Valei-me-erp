import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { handleIfoodWebhook } from "../integrations/ifood/ifoodWebhookController.js";
import { ifoodWebhookRateLimit, ifoodWebhookSecurity } from "../middlewares/ifoodWebhookSecurity.js";
import { rateLimitByWebhookEmpresa } from "../middlewares/empresaRateLimit.js";

const router = Router();

router.post(
	"/ifood",
	ifoodWebhookRateLimit,
	...ifoodWebhookSecurity,
	rateLimitByWebhookEmpresa({ route: "/webhook/ifood" }),
	asyncHandler(handleIfoodWebhook),
);

export default router;
