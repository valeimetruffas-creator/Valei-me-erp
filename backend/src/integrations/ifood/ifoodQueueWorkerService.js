import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ifoodQueueService } from "./ifoodQueueService.js";

let timer = null;
const workerId = `ifood-worker-${crypto.randomUUID()}`;

async function runCycle() {
  const items = await ifoodQueueService.listProcessable();
  if (!items.length) {
    return;
  }

  for (const item of items) {
    try {
      await ifoodQueueService.processItem(item, workerId);
    } catch (error) {
      logger.error("ifood_queue_cycle_item_unhandled", {
        itemId: item.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function startIfoodQueueWorker() {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    logger.warn("ifood_queue_worker_skipped_missing_firebase_config");
    return;
  }

  if (timer) {
    return;
  }

  const intervalMs = Number(env.ifoodQueueWorkerIntervalMs || 5000);

  timer = setInterval(() => {
    runCycle().catch((error) => {
      logger.error("ifood_queue_cycle_unhandled", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, intervalMs);

  runCycle().catch((error) => {
    logger.error("ifood_queue_initial_cycle_unhandled", {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  logger.info("ifood_queue_worker_started", { workerId, intervalMs });
}

export function stopIfoodQueueWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
