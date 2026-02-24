import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_OPEN_MS = 60_000;

const circuitState = {
  consecutiveFailures: 0,
  status: "closed",
  openedAt: null,
  retryAt: null,
};

function nowTs() {
  return Date.now();
}

function tripCircuit() {
  const openedAt = nowTs();
  const retryAt = openedAt + CIRCUIT_BREAKER_OPEN_MS;
  circuitState.status = "open";
  circuitState.openedAt = openedAt;
  circuitState.retryAt = retryAt;

  logger.warn("ifood_circuit_opened", {
    consecutiveFailures: circuitState.consecutiveFailures,
    retryAt: new Date(retryAt).toISOString(),
  });
}

function shouldBlockRequest() {
  if (circuitState.status !== "open") {
    return false;
  }

  const now = nowTs();
  if (typeof circuitState.retryAt === "number" && now < circuitState.retryAt) {
    return true;
  }

  circuitState.status = "half_open";
  logger.info("ifood_circuit_half_open", {
    consecutiveFailures: circuitState.consecutiveFailures,
  });
  return false;
}

function onRequestSuccess() {
  if (circuitState.status !== "closed" || circuitState.consecutiveFailures > 0) {
    logger.info("ifood_circuit_closed", {
      previousStatus: circuitState.status,
      previousFailures: circuitState.consecutiveFailures,
    });
  }

  circuitState.consecutiveFailures = 0;
  circuitState.status = "closed";
  circuitState.openedAt = null;
  circuitState.retryAt = null;
}

function onRequestFailure(error) {
  circuitState.consecutiveFailures += 1;

  logger.warn("ifood_circuit_failure", {
    consecutiveFailures: circuitState.consecutiveFailures,
    status: circuitState.status,
    error: error instanceof Error ? error.message : String(error),
  });

  if (circuitState.consecutiveFailures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
    tripCircuit();
  }
}

export function getIfoodCircuitStatus() {
  return {
    status: circuitState.status,
    consecutiveFailures: circuitState.consecutiveFailures,
    openedAt: circuitState.openedAt ? new Date(circuitState.openedAt).toISOString() : null,
    retryAt: circuitState.retryAt ? new Date(circuitState.retryAt).toISOString() : null,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function ifoodRequest({ method = "GET", path, token, body, headers = {} }) {
  if (shouldBlockRequest()) {
    const error = new Error("Circuit breaker iFood aberto. Tente novamente em instantes.");
    error.code = "IFOOD_CIRCUIT_OPEN";
    error.statusCode = 503;
    throw error;
  }

  const url = `${env.ifoodApiBaseUrl}${path}`;
  const timeoutMs = Number(env.ifoodRequestTimeoutMs || 15000);

  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body !== undefined) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
    payload = finalHeaders["Content-Type"] === "application/json"
      ? JSON.stringify(body)
      : body;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal: controller.signal,
      });

      const data = await parseResponse(response);
      if (!response.ok) {
        const message = typeof data === "string" ? data : data?.message || "Falha na API iFood";
        const error = new Error(`[iFood] ${response.status} ${message}`);
        error.statusCode = response.status;
        error.response = data;
        throw error;
      }

      onRequestSuccess();
      return data;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`[iFood] timeout após ${timeoutMs}ms`);
      timeoutError.code = "IFOOD_TIMEOUT";
      onRequestFailure(timeoutError);
      throw timeoutError;
    }

    onRequestFailure(error);
    throw error;
  }
}
