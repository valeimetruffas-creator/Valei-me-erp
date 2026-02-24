import {
  estoqueService,
  clienteService,
  configuracaoService,
} from "../services/simpleServices.js";

function createController(service, label) {
  return {
    list: async (req, res) => {
      const data = await service.list(req.authUser.empresaId);
      res.json({ success: true, data });
    },
    create: async (req, res) => {
      const data = await service.create(req.authUser.empresaId, req.body);
      res.status(201).json({ success: true, data });
    },
    update: async (req, res) => {
      const data = await service.update(req.params.id, req.authUser.empresaId, req.body);
      if (!data) {
        return res.status(404).json({ success: false, error: `${label} não encontrado` });
      }
      return res.json({ success: true, data });
    },
  };
}

export const estoqueController = createController(estoqueService, "Item de estoque");
export const clienteController = createController(clienteService, "Cliente");
export const configuracaoController = createController(configuracaoService, "Configuração");
