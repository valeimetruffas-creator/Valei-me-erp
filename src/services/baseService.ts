import { Insumo } from "./estoqueService";

/** Ingrediente da base */
export interface IngredienteBase {
  insumoId: string;
  nome: string;
  quantidade: number; // em g, ml ou un
  unidade: string;
  custoTotal: number;
}

/** Base (pré-preparo) */
export interface Base {
  id: string;
  nome: string;
  rendimento: number; // em gramas
  ingredientes: IngredienteBase[];
}

/** LocalStorage */
const STORAGE_KEY = "valeime-bases";

/** Listar bases */
export function listarBases(): Base[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

/** Salvar ou atualizar base */
export function salvarBase(base: Base) {
  const bases = listarBases();
  const index = bases.findIndex(b => b.id === base.id);

  if (index >= 0) {
    bases[index] = base;
  } else {
    bases.push(base);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bases));
}

/** Excluir base */
export function excluirBase(id: string) {
  const bases = listarBases().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bases));
}

/** Calcular custo total da base */
export function calcularCustoBase(base: Base): number {
  return base.ingredientes.reduce(
    (total, ing) => total + (ing.custoTotal || 0),
    0
  );
}

/** Custo por grama */
export function calcularCustoPorGrama(base: Base): number {
  const custo = calcularCustoBase(base);
  return base.rendimento > 0 ? custo / base.rendimento : 0;
}
