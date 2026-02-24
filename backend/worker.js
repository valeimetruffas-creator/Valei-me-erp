import "dotenv/config";
import crypto from "node:crypto";
import { ifoodQueueService } from "./src/integrations/ifood/ifoodQueueService.js";
import { logger } from "./src/config/logger.js";

const DELAY_MS = 5000;
const workerId = `ifood-worker-${crypto.randomUUID()}`;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runCycle() {
  const items = await ifoodQueueService.listProcessable();

  try {
    if (items.length) {
      for (const item of items) {
        try {
          await ifoodQueueService.processItem(item, workerId);
        } catch (error) {
          logger.error("ifood_worker_item_unhandled", {
            itemId: item.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    await ifoodQueueService.refreshQueueSizeMetrics();
  } catch (error) {
    logger.error("ifood_worker_metrics_cycle_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return items.length;
}

async function startWorker() {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    logger.error("ifood_worker_missing_firebase_config");
    process.exit(1);
  }

  logger.info("ifood_worker_started", { workerId, delayMs: DELAY_MS });

  while (true) {
    try {
      const processed = await runCycle();
      logger.info("ifood_worker_cycle", { workerId, processed });
    } catch (error) {
      logger.error("ifood_worker_cycle_unhandled", {
        workerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await sleep(DELAY_MS);
  }
}

process.on("unhandledRejection", (reason) => {
  logger.error("ifood_worker_unhandled_rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("ifood_worker_uncaught_exception", {
    message: error.message,
    stack: error.stack,
  });
});

startWorker().catch((error) => {
  logger.error("ifood_worker_start_failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
