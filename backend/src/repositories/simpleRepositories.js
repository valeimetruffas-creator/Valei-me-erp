import { BaseTenantRepository } from "./baseRepository.js";

export const estoqueRepository = new BaseTenantRepository("estoque");
export const clienteRepository = new BaseTenantRepository("clientes");
export const configuracaoRepository = new BaseTenantRepository("configuracoes");
