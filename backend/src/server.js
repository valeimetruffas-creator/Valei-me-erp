import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { apiRateLimit } from "./middlewares/rateLimit.js";
import { sanitizeBody } from "./middlewares/sanitize.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { startIfoodPolling } from "./integrations/ifood/ifoodPollingService.js";
import { startIfoodReconciliation } from "./integrations/ifood/ifoodReconciliationService.js";
import healthRouter from "./routes/health.js";
import webhookRouter from "./routes/webhook.js";
import ifoodTestRouter from "./routes/ifoodTest.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json({
  limit: "10mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString("utf8");
  },
}));
app.use(apiRateLimit);
app.use(sanitizeBody);
app.use(requestLogger);

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    if (proto !== "https") {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    return next();
  });
}

app.use("/", healthRouter);
app.use("/webhook", webhookRouter);
app.use("/ifood", ifoodTestRouter);
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  logger.error("process_unhandled_rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("process_uncaught_exception", {
    message: error.message,
    stack: error.stack,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Environment:", process.env.NODE_ENV);
  console.log(`Server running on port ${PORT}`);
  logger.info("backend_started", { port: PORT, host: "0.0.0.0", nodeEnv: env.nodeEnv });
  startIfoodPolling();
  startIfoodReconciliation();
});
