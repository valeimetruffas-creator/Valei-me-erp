import { pedidoService } from "../services/pedidoService.js";

export async function listPedidos(req, res) {
  const data = await pedidoService.list(req.authUser.empresaId, req.query.status);
  res.json({ success: true, data });
}

export async function createPedido(req, res) {
  const data = await pedidoService.create(req.authUser.empresaId, req.body);
  res.status(201).json({ success: true, data });
}

export async function updateStatusPedido(req, res) {
  const data = await pedidoService.updateStatus(req.params.id, req.authUser.empresaId, req.body.status);
  if (!data) {
    return res.status(404).json({ success: false, error: "Pedido não encontrado" });
  }

  return res.json({ success: true, data });
}
