// src/services/estoqueService.ts

import { Insumo } from "../types/Insumo";

/** Insumo do estoque */
export interface InsumoEstoque {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string; // g, ml, un, etc
  custoUnitario: number;
}

// Exportar Insumo para compatibilidade
export type { Insumo };

const STORAGE_KEY = "valeime-estoque-insumos";

/** Listar estoque */
export function listarEstoque(): InsumoEstoque[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

/** Obter insumos (alias para compatibilidade) */
export function getInsumos(): InsumoEstoque[] {
  return listarEstoque();
}

/** Salvar estoque */
export function salvarEstoque(lista: InsumoEstoque[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

/** Remover insumos do estoque baseado na venda */
export function removerInsumoDoEstoque(
  componentes: {
    itemId: string;
    quantidade: number;
  }[],
  quantidadeVendida: number
) {
  const estoque = listarEstoque();

  const estoqueAtualizado = estoque.map(insumo => {
    const componente = componentes.find(c => c.itemId === insumo.id);

    if (!componente) return insumo;

    const consumoTotal = componente.quantidade * quantidadeVendida;

    return {
      ...insumo,
      quantidade: insumo.quantidade - consumoTotal,
    };
  });

  salvarEstoque(estoqueAtualizado);
}