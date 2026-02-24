import {
  estoqueRepository,
  clienteRepository,
  configuracaoRepository,
} from "../repositories/simpleRepositories.js";

function createCrudService(repository) {
  return {
    list: (empresaId) => repository.listByEmpresa(empresaId),
    create: (empresaId, payload) => repository.create(empresaId, payload),
    update: (id, empresaId, payload) => repository.updateById(id, empresaId, payload),
  };
}

export const estoqueService = createCrudService(estoqueRepository);
export const clienteService = createCrudService(clienteRepository);
export const configuracaoService = createCrudService(configuracaoRepository);
