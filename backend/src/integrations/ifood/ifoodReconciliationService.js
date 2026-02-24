import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ifoodConfigRepository } from "./ifoodConfigRepository.js";
import { ifoodAuthService } from "./ifoodAuthService.js";
import { ifoodRequest } from "./ifoodHttpClient.js";
import { ifoodOrderService } from "./ifoodOrderService.js";
import { pedidoService } from "../../services/pedidoService.js";
import { mapIfoodOrderStatusToInternal, mapOrderToSystem } from "./ifoodMapper.js";

let timer = null;

function extractOrderIds(response) {
  const arr = Array.isArray(response)
    ? response
    : Array.isArray(response?.orders)
      ? response.orders
      : [];

  return arr
    .map((item) => item?.id || item?.orderId)
    .filter(Boolean);
}

async function reconcileEmpresa(empresaId, merchantId) {
  const token = await ifoodAuthService.getAccessToken(empresaId);
  const listResponse = await ifoodRequest({
    method: "GET",
    path: `/orders?merchantId=${encodeURIComponent(merchantId)}`,
    token,
  });

  const orderIds = extractOrderIds(listResponse);
  let created = 0;
  let fixedStatus = 0;

  for (const orderId of orderIds) {
    try {
      const details = await ifoodOrderService.fetchOrderDetails(empresaId, orderId);
      const mapped = mapOrderToSystem(details);
      const internalStatus = mapIfoodOrderStatusToInternal(details?.orderStatus || details?.status);

      const existing = await pedidoService.findByIfoodOrderId(empresaId, orderId);
      if (!existing) {
        await pedidoService.upsertFromIfood(empresaId, orderId, {
          ...mapped,
          status: internalStatus || mapped.status || "confirmado",
          origem: "ifood",
        });
        created += 1;
        continue;
      }

      await pedidoService.upsertFromIfood(empresaId, orderId, {
        ...mapped,
        status: existing.status,
        origem: "ifood",
      });

      if (internalStatus && existing.status !== internalStatus) {
        await pedidoService.updateStatusByIfoodOrderId(empresaId, orderId, internalStatus);
        fixedStatus += 1;
      }
    } catch (error) {
      logger.error("ifood_reconcile_order_failed", {
        empresaId,
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info("ifood_reconcile_empresa_done", {
    empresaId,
    merchantId,
    totalOrders: orderIds.length,
    created,
    fixedStatus,
  });
}

async function runCycle() {
  const ativos = await ifoodConfigRepository.listAtivos();

  for (const config of ativos) {
    const empresaId = config.empresaId;
    const merchantId = config.merchantId;
    if (!merchantId) {
      continue;
    }

    try {
      await reconcileEmpresa(empresaId, merchantId);
    } catch (error) {
      logger.error("ifood_reconcile_empresa_failed", {
        empresaId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function startIfoodReconciliation() {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    logger.warn("ifood_reconciliation_skipped_missing_firebase_config");
    return;
  }

  if (timer) {
    return;
  }

  const intervalMs = Number(env.ifoodReconciliationIntervalMs || 120000);

  timer = setInterval(() => {
    runCycle().catch((error) => {
      logger.error("ifood_reconciliation_cycle_unhandled", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, intervalMs);

  runCycle().catch((error) => {
    logger.error("ifood_reconciliation_initial_cycle_unhandled", {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  logger.info("ifood_reconciliation_started", { intervalMs });
}

export function stopIfoodReconciliation() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
