export function mapProductToIfood(produto) {
  return {
    code: produto.id,
    name: produto.nome,
    description: produto.descricao || "",
    category: produto.categoria || "Geral",
    price: Number((produto.precoVenda || 0).toFixed(2)),
    available: Boolean(produto.ativo),
  };
}

export function mapOrderToSystem(orderDetail) {
  const items = Array.isArray(orderDetail?.items) ? orderDetail.items : [];
  const payments = Array.isArray(orderDetail?.payments) ? orderDetail.payments : [];

  return {
    cliente: {
      nome: orderDetail?.customer?.name || "Cliente iFood",
      whatsapp: orderDetail?.customer?.phone?.number || "",
    },
    itens: items.map((item) => ({
      produtoId: item?.externalCode || item?.id || "",
      nome: item?.name || "Item",
      quantidade: Number(item?.quantity || 1),
      precoUnitario: Number(item?.unitPrice || 0),
      observacao: item?.observations || "",
    })),
    total: Number(orderDetail?.total?.orderAmount || 0),
    entrega: {
      tipo: "entrega",
      logradouro: orderDetail?.delivery?.deliveryAddress?.streetName || "",
      numero: orderDetail?.delivery?.deliveryAddress?.streetNumber || "",
      bairro: orderDetail?.delivery?.deliveryAddress?.neighborhood || "",
      cidade: orderDetail?.delivery?.deliveryAddress?.city || "",
      referencia: orderDetail?.delivery?.deliveryAddress?.reference || "",
    },
    formaPagamento: mapPayment(payments[0]?.method),
    observacao: orderDetail?.orderTiming?.mode || "",
    origem: "ifood",
    status: "confirmado",
    ifoodOrderId: orderDetail?.id || "",
  };
}

function mapPayment(method) {
  if (!method) return "pix";
  const normalized = String(method).toLowerCase();
  if (normalized.includes("cash") || normalized.includes("dinheiro")) return "dinheiro";
  if (normalized.includes("card") || normalized.includes("credito") || normalized.includes("debito")) return "cartao";
  return "pix";
}

export function mapStatus(statusInterno) {
  const normalized = String(statusInterno || "").toLowerCase();
  if (normalized === "confirmado") return "confirm";
  if (normalized === "preparando") return "ready";
  if (normalized === "saiu_entrega") return "dispatch";
  return null;
}

export function mapIfoodOrderStatusToInternal(ifoodStatus) {
  const normalized = String(ifoodStatus || "").toLowerCase();

  if (["placed", "created", "pending"].includes(normalized)) return "pendente";
  if (["confirmed", "accepted"].includes(normalized)) return "confirmado";
  if (["preparing", "ready"].includes(normalized)) return "preparando";
  if (["dispatched", "out_for_delivery", "saiu_entrega"].includes(normalized)) return "saiu_entrega";
  if (["delivered", "concluded", "completed"].includes(normalized)) return "entregue";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelado";
  return null;
}
