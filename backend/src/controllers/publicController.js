import { listPublicProdutosByEmpresa } from "./produtoController.js";
import { pedidoService } from "../services/pedidoService.js";
import { tenantService } from "../services/tenantService.js";

async function resolveEmpresa(empresaSlug) {
  const empresa = await tenantService.getEmpresaBySlug(empresaSlug);
  if (!empresa) {
    return null;
  }

  return empresa;
}

export async function listPublicProdutos(req, res) {
  const empresaSlug = String(req.query.empresaSlug || "").trim();
  const empresa = await resolveEmpresa(empresaSlug);
  if (!empresa) {
    return res.status(404).json({ success: false, error: "Empresa não encontrada" });
  }

  const data = await listPublicProdutosByEmpresa(empresa.id);
  return res.json({ success: true, data });
}

export async function listPublicCardapio(req, res) {
  return listPublicProdutos(req, res);
}

export async function createPublicPedido(req, res) {
  const empresaSlug = String(req.query.empresaSlug || "").trim();
  const empresa = await resolveEmpresa(empresaSlug);
  if (!empresa) {
    return res.status(404).json({ success: false, error: "Empresa não encontrada" });
  }

  const data = await pedidoService.create(empresa.id, {
    ...req.body,
    origem: "delivery",
    status: "pendente",
  });

  return res.status(201).json({ success: true, data });
}
