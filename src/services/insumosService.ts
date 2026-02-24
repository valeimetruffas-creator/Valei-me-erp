import { Insumo } from "../types/Insumo";
import { salvar, carregar } from "./storage";
import { paraGramas } from "../utils/conversao";

const KEY = "valeime-insumos";

export function listarInsumos(): Insumo[] {
  return carregar<Insumo[]>(KEY);
}

export function salvarInsumos(lista: Insumo[]) {
  salvar(KEY, lista);
}

export function adicionarInsumo(nome: string, preco: number) {
  const lista = listarInsumos();
  lista.push({
    id: crypto.randomUUID(),
    nome,
    precoPorKg: preco,
    estoqueGramas: 0,
    minimoGramas: 1000,
  });
  salvarInsumos(lista);
}

export function entradaEstoque(insumoId: string, qtd: number) {
  const lista = listarInsumos();
  const insumo = lista.find(i => i.id === insumoId);
  if (!insumo) return;

  insumo.estoqueGramas = (insumo.estoqueGramas || 0) + qtd;
  salvarInsumos(lista);
}
