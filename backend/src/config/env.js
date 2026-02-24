export const env = {
  nodeEnv: process.env.NODE_ENV || "production",
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || true,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  rateWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateMaxRequests: Number(process.env.RATE_LIMIT_MAX || 300),
  ifoodApiBaseUrl: process.env.IFOOD_API_BASE_URL || "https://merchant-api.ifood.com.br",
  ifoodRequestTimeoutMs: Number(process.env.IFOOD_REQUEST_TIMEOUT_MS || 15000),
  ifoodWebhookSecret: process.env.IFOOD_WEBHOOK_SECRET || "",
  ifoodEncryptionKey: process.env.IFOOD_ENCRYPTION_KEY || "",
  ifoodAlertWebhookUrl: process.env.IFOOD_ALERT_WEBHOOK_URL || "",
  ifoodPollingEnabled: process.env.IFOOD_POLLING_ENABLED !== "false",
  ifoodPollingIntervalMs: Number(process.env.IFOOD_POLLING_INTERVAL_MS || 30000),
  ifoodQueueWorkerIntervalMs: Number(process.env.IFOOD_QUEUE_WORKER_INTERVAL_MS || 5000),
  ifoodReconciliationIntervalMs: Number(process.env.IFOOD_RECONCILIATION_INTERVAL_MS || 120000),
};

export function isProduction() {
  return env.nodeEnv === "production";
}
