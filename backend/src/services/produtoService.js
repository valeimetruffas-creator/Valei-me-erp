import { produtoRepository } from "../repositories/produtoRepository.js";

class ProdutoService {
  list(empresaId) {
    return produtoRepository.listByEmpresa(empresaId);
  }

  listPublic(empresaId) {
    return produtoRepository.listPublicByEmpresa(empresaId);
  }

  create(empresaId, payload) {
    const precoVenda = Number(payload.precoVenda.toFixed(2));
    return produtoRepository.create(empresaId, {
      ...payload,
      precoVenda,
    });
  }

  update(id, empresaId, payload) {
    const next = { ...payload };
    if (typeof payload.precoVenda === "number") {
      next.precoVenda = Number(payload.precoVenda.toFixed(2));
    }

    return produtoRepository.updateById(id, empresaId, next);
  }
}

export const produtoService = new ProdutoService();
