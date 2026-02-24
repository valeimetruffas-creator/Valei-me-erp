import { logger } from "../config/logger.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `Rota não encontrada: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  void next;
  console.error("[ERR]", err?.message || "Erro interno", req.method, req.originalUrl);
  logger.error("unhandled_error", {
    message: err?.message || "Erro interno",
    stack: err?.stack,
    path: req.originalUrl,
    method: req.method,
    empresaId: req.authUser?.empresaId || null,
    uid: req.authUser?.uid || null,
  });

  const status = Number(err?.statusCode || 500);
  res.status(status).json({
    success: false,
    error: err?.message || "Erro interno do servidor",
  });
}
