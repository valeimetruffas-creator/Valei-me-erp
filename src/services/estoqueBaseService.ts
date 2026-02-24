import { Base } from "./baseService";
import { getInsumos } from "./estoqueService";

/** Estoque de base */
export interface EstoqueBase {
  baseId: string;
  nome: string;
  quantidade: number; // em gramas
}

const STORAGE_KEY = "valeime-estoque-bases";

/** Listar estoque de bases */
export function getEstoqueBases(): EstoqueBase[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

/** Salvar estoque */
function salvarEstoque(estoque: EstoqueBase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estoque));
}

/** Produzir base (baixa insumos e adiciona base ao estoque) */
export async function produzirBase(base: Base, quantidadeProduzida: number) {
  if (quantidadeProduzida <= 0) return;

  // 🔻 BAIXAR INSUMOS
  const insumos = await getInsumos();
  const estoqueInsumos = JSON.parse(
    localStorage.getItem("estoque-categorizado") || "[]"
  );

  base.ingredientes.forEach(ing => {
    const fator = quantidadeProduzida / base.rendimento;
    const consumo = ing.quantidade * fator;

    const item = estoqueInsumos.find(
      (i: any) => i.nome.toLowerCase() === ing.nome.toLowerCase()
    );

    if (item) {
      item.quantidade = Math.max(0, item.quantidade - consumo);
    }
  });

  localStorage.setItem(
    "estoque-categorizado",
    JSON.stringify(estoqueInsumos)
  );

  // ➕ ADICIONAR BASE AO ESTOQUE
  const estoqueBases = getEstoqueBases();
  const existente = estoqueBases.find(e => e.baseId === base.id);

  if (existente) {
    existente.quantidade += quantidadeProduzida;
  } else {
    estoqueBases.push({
      baseId: base.id,
      nome: base.nome,
      quantidade: quantidadeProduzida,
    });
  }

  salvarEstoque(estoqueBases);
}
