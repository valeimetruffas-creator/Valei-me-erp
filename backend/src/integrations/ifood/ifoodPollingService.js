import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ifoodConfigRepository } from "./ifoodConfigRepository.js";
import { ifoodOrderService } from "./ifoodOrderService.js";

let timer = null;

async function runCycle() {
  let ativos = [];

  try {
    ativos = await ifoodConfigRepository.listAtivos();
  } catch (error) {
    logger.error("ifood_poll_list_active_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  for (const config of ativos) {
    const empresaId = config.empresaId;
    try {
      const result = await ifoodOrderService.pollEvents(empresaId);
      logger.info("ifood_poll_cycle", { empresaId, totalEvents: result.totalEvents });
    } catch (error) {
      logger.error("ifood_poll_cycle_failed", {
        empresaId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function startIfoodPolling() {
  if (!env.ifoodPollingEnabled) {
    logger.info("ifood_polling_disabled");
    return;
  }

  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    logger.warn("ifood_polling_skipped_missing_firebase_config");
    return;
  }

  if (timer) {
    return;
  }

  timer = setInterval(() => {
    runCycle().catch((error) => {
      logger.error("ifood_poll_cycle_unhandled", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, env.ifoodPollingIntervalMs);

  runCycle().catch((error) => {
    logger.error("ifood_poll_initial_cycle_unhandled", {
      error: error instanceof Error ? error.message : String(error),
    });
  });
  logger.info("ifood_polling_started", { intervalMs: env.ifoodPollingIntervalMs });
}

export function stopIfoodPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
