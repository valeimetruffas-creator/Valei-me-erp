import { BaseTenantRepository } from "./baseRepository.js";

class PedidoRepository extends BaseTenantRepository {
  constructor() {
    super("pedidos");
  }

  async listByEmpresaAndStatus(empresaId, status) {
    return this.listByEmpresa(empresaId, { status });
  }

  async findByIfoodOrderId(empresaId, ifoodOrderId) {
    const snap = await this.collection()
      .where("empresaId", "==", empresaId)
      .where("ifoodOrderId", "==", ifoodOrderId)
      .limit(1)
      .get();

    if (snap.empty) {
      return null;
    }

    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async updateByIfoodOrderId(empresaId, ifoodOrderId, payload) {
    const pedido = await this.findByIfoodOrderId(empresaId, ifoodOrderId);
    if (!pedido) {
      return null;
    }

    return this.updateById(pedido.id, empresaId, payload);
  }
}

export const pedidoRepository = new PedidoRepository();
