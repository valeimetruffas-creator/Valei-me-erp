import { produtoService } from "../services/produtoService.js";

export async function listProdutos(req, res) {
  const data = await produtoService.list(req.authUser.empresaId);
  res.json({ success: true, data });
}

export async function createProduto(req, res) {
  const data = await produtoService.create(req.authUser.empresaId, req.body);
  res.status(201).json({ success: true, data });
}

export async function updateProduto(req, res) {
  const data = await produtoService.update(req.params.id, req.authUser.empresaId, req.body);
  if (!data) {
    return res.status(404).json({ success: false, error: "Produto não encontrado" });
  }

  return res.json({ success: true, data });
}

export async function listPublicProdutosByEmpresa(empresaId) {
  return produtoService.listPublic(empresaId);
}
