import { FichaTecnica } from "../types/FichaTecnica";
import { listarInsumos } from "./insumosService";
import { salvar, carregar } from "./storage";

const KEY = "valeime-fichas";

export function listarFichas(): FichaTecnica[] {
  return carregar<FichaTecnica[]>(KEY);
}

export function salvarFichas(lista: FichaTecnica[]) {
  salvar(KEY, lista);
}

export function calcularCusto(ficha: FichaTecnica) {
  const insumos = listarInsumos();
  let total = 0;

  ficha.itens.forEach(item => {
    const insumo = insumos.find(i => i.id === item.insumoId);
    if (!insumo) return;

    const custoPorGrama = (insumo.precoPorKg || 0) / 1000;

    total += custoPorGrama * (item.quantidadeGramas || 0);
  });

  const custoUnitario = total / ficha.rendimento;
  const precoVenda = custoUnitario * (1 + ficha.margemLucro / 100);

  return { total, custoUnitario, precoVenda };
}
