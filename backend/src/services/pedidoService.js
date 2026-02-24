import { pedidoRepository } from "../repositories/pedidoRepository.js";

const STATUS_VALIDOS = [
  "pendente",
  "confirmado",
  "preparando",
  "saiu_entrega",
  "entregue",
  "cancelado",
];

class PedidoService {
  async create(empresaId, payload) {
    const total = payload.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);

    return pedidoRepository.create(empresaId, {
      ...payload,
      total: Number(total.toFixed(2)),
      status: payload.status || "pendente",
      origem: payload.origem || "delivery",
    });
  }

  async criarPedidoDelivery(empresaId, payload) {
    return this.create(empresaId, {
      ...payload,
      origem: payload.origem || "delivery",
    });
  }

  list(empresaId, status) {
    if (status) {
      return pedidoRepository.listByEmpresaAndStatus(empresaId, status);
    }

    return pedidoRepository.listByEmpresa(empresaId);
  }

  async updateStatus(id, empresaId, status) {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new Error("Status de pedido inválido");
    }

    return pedidoRepository.updateById(id, empresaId, { status });
  }

  findByIfoodOrderId(empresaId, ifoodOrderId) {
    return pedidoRepository.findByIfoodOrderId(empresaId, ifoodOrderId);
  }

  async upsertFromIfood(empresaId, ifoodOrderId, payload) {
    const existente = await pedidoRepository.findByIfoodOrderId(empresaId, ifoodOrderId);
    if (existente) {
      return pedidoRepository.updateById(existente.id, empresaId, {
        ...payload,
        ifoodOrderId,
      });
    }

    return this.create(empresaId, {
      ...payload,
      ifoodOrderId,
      origem: "ifood",
    });
  }

  async updateStatusByIfoodOrderId(empresaId, ifoodOrderId, status) {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new Error("Status de pedido inválido");
    }

    return pedidoRepository.updateByIfoodOrderId(empresaId, ifoodOrderId, { status });
  }
}

export const pedidoService = new PedidoService();
