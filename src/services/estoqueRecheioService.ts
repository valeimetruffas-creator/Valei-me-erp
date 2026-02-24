import { Recheio } from "./recheioService";
import { getEstoqueBases } from "./estoqueBaseService";

/** Estoque de recheio */
export interface EstoqueRecheio {
  recheioId: string;
  nome: string;
  quantidade: number; // em gramas
}

const STORAGE_KEY = "valeime-estoque-recheios";

/** Listar estoque de recheios */
export function getEstoqueRecheios(): EstoqueRecheio[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function salvarEstoque(estoque: EstoqueRecheio[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estoque));
}

/** Produzir recheio */
export function produzirRecheio(recheio: Recheio, quantidadeProduzida: number) {
  if (quantidadeProduzida <= 0) return;

  // 🔻 Baixar bases
  const estoqueBases = getEstoqueBases();

  recheio.componentes
    .filter(c => c.tipo === "BASE")
    .forEach(comp => {
      const fator = quantidadeProduzida / recheio.rendimento;
      const consumo = comp.quantidade * fator;

      const base = estoqueBases.find(
        b => b.nome.toLowerCase() === comp.nome.toLowerCase()
      );

      if (base) {
        base.quantidade = Math.max(0, base.quantidade - consumo);
      }
    });

  localStorage.setItem(
    "valeime-estoque-bases",
    JSON.stringify(estoqueBases)
  );

  // ➕ Adicionar recheio ao estoque
  const estoqueRecheios = getEstoqueRecheios();
  const existente = estoqueRecheios.find(r => r.recheioId === recheio.id);

  if (existente) {
    existente.quantidade += quantidadeProduzida;
  } else {
    estoqueRecheios.push({
      recheioId: recheio.id,
      nome: recheio.nome,
      quantidade: quantidadeProduzida,
    });
  }

  salvarEstoque(estoqueRecheios);
}
