// src/services/produtoFinalService.ts

/** Tipos de componentes usados no produto final */
export type TipoComponente = "BASE" | "RECHEIO" | "INSUMO";

/** Componente do Produto Final */
export interface ComponenteProdutoFinal {
  tipo: TipoComponente;
  itemId: string;      // id da base, recheio ou insumo
  nome: string;
  quantidade: number; // quantidade usada
  unidade: string;    // g, ml, un, etc
}

/** Produto Final (vendável) */
export interface ProdutoFinal {
  id: string;
  nome: string;
  categoria: string; // Copo, Bolo, Travessa...
  componentes: ComponenteProdutoFinal[];
  precoVenda: number;
}

const STORAGE_KEY = "valeime-produtos-finais";

/** =========================
 * CRUD PRODUTO FINAL
 ========================== */

/** Listar produtos finais */
export function listarProdutosFinais(): ProdutoFinal[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

/** Buscar produto por ID */
export function buscarProdutoFinalPorId(id: string): ProdutoFinal | undefined {
  return listarProdutosFinais().find(p => p.id === id);
}

/** Salvar ou atualizar produto final */
export function salvarProdutoFinal(produto: ProdutoFinal) {
  const lista = listarProdutosFinais();
  const index = lista.findIndex(p => p.id === produto.id);

  if (index >= 0) {
    lista[index] = produto;
  } else {
    lista.push(produto);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

/** Excluir produto final */
export function excluirProdutoFinal(id: string) {
  const novaLista = listarProdutosFinais().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
}

/** =========================
 * CÁLCULOS
 ========================== */

/** Calcula custo total do produto final (dinâmico)
 * OBS: aqui entra a integração com BASE / RECHEIO / ESTOQUE
 */
export function calcularCustoProdutoFinal(
  produto: ProdutoFinal,
  calcularCustoComponente: (componente: ComponenteProdutoFinal) => number
): number {
  return produto.componentes.reduce((total, componente) => {
    return total + calcularCustoComponente(componente);
  }, 0);
}

/** Calcula preço de venda sugerido */
export function calcularPrecoVenda(
  custoTotal: number,
  margem: number // ex: 2.5 = 250%
): number {
  return custoTotal * margem;
}
