import { CheckoutDelivery, ProdutoCardapio } from "../types/DeliveryCliente";

const API_URL = import.meta.env.VITE_API_URL || "";

function ensureApiUrl() {
  if (!API_URL) {
    throw new Error("VITE_API_URL não configurada para API pública");
  }
}

export async function obterCardapioPublico(empresaSlug: string): Promise<ProdutoCardapio[]> {
  ensureApiUrl();
  const response = await fetch(`${API_URL}/public/cardapio?empresaSlug=${encodeURIComponent(empresaSlug)}`);
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Falha ao carregar cardápio");
  }

  return Array.isArray(json.data) ? json.data : [];
}

export async function criarPedidoPublico(empresaSlug: string, payload: CheckoutDelivery & { itens: Array<{ produtoId: string; nome: string; quantidade: number; precoUnitario: number; observacao?: string; }> }) {
  ensureApiUrl();
  const response = await fetch(`${API_URL}/public/pedidos?empresaSlug=${encodeURIComponent(empresaSlug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Falha ao criar pedido");
  }

  return json.data;
}
