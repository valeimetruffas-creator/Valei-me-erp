import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const apiRateLimit = rateLimit({
  windowMs: env.rateWindowMs,
  max: env.rateMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Muitas requisições. Tente novamente em alguns minutos." },
});
