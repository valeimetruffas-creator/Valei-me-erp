import { BaseTenantRepository } from "./baseRepository.js";

class ProdutoRepository extends BaseTenantRepository {
  constructor() {
    super("produtos");
  }

  async listPublicByEmpresa(empresaId) {
    const snap = await this.collection()
      .where("empresaId", "==", empresaId)
      .where("ativo", "==", true)
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export const produtoRepository = new ProdutoRepository();
