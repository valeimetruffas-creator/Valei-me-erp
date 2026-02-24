import { logger } from "../config/logger.js";

export function requestLogger(req, res, next) {
  const start = Date.now();

  console.log(`[REQ] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    logger.info("http_request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      empresaId: req.authUser?.empresaId || null,
      uid: req.authUser?.uid || null,
      ip: req.ip,
    });
  });

  next();
}
