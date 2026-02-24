import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL || "";

function getBaseUrl() {
  if (!API_URL) {
    throw new Error("VITE_API_URL não configurada");
  }

  return API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
}

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(await authHeaders()),
      ...(init?.headers || {}),
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Falha na integração iFood");
  }

  return json.data;
}

export async function conectarIfood(payload: { clientId: string; clientSecret: string; merchantId?: string; ativo?: boolean }) {
  return request("/ifood/connect", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function statusIfood() {
  return request("/ifood/status", { method: "GET" });
}

export async function dashboardIfood() {
  return request("/ifood/dashboard", { method: "GET" });
}

export async function syncCatalogoIfood(payload?: { merchantId?: string }) {
  return request("/ifood/sync-catalog", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function desconectarIfood() {
  return request("/ifood/disconnect", { method: "POST" });
}
