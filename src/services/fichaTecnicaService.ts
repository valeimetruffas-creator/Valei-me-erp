import { FichaTecnica } from "../types/FichaTecnica";
import { getInsumos, salvarEstoque } from "./estoqueService";

const STORAGE_KEY = "fichas-tecnicas";

export function getFichas(): FichaTecnica[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function salvarFichas(lista: FichaTecnica[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

/* Abate estoque ao usar a ficha */
export function aplicarFichaTecnica(ficha: FichaTecnica) {
  const estoque = getInsumos();

  ficha.itens.forEach((item: any) => {
    const i = estoque.findIndex((e: any) => e.id === item.insumoId);
    if (i >= 0) {
      estoque[i].quantidade -= item.quantidade;
      if (estoque[i].quantidade < 0) estoque[i].quantidade = 0;
    }
  });

  salvarEstoque(estoque);
}
