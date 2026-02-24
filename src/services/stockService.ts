export interface ProdutoEstoque {
  nome: string;
  quantidade: number;
  preco: number;
  categoria?: string;
}

export function addStock(produto: ProdutoEstoque) {
  const estoque = JSON.parse(localStorage.getItem("estoque-categorizado") || "[]");
  const existente = estoque.find((item: any) => item.nome.toLowerCase() === produto.nome.toLowerCase());
  if (existente) {
    existente.quantidade += produto.quantidade;
    existente.preco = produto.preco;
    if (produto.categoria) existente.categoria = produto.categoria;
  } else {
    estoque.push({ ...produto });
  }
  localStorage.setItem("estoque-categorizado", JSON.stringify(estoque));
}

export function getStock(): ProdutoEstoque[] {
  return JSON.parse(localStorage.getItem("estoque-categorizado") || "[]");
}

export function removeStock(nome: string, quantidade: number) {
  const estoque = JSON.parse(localStorage.getItem("estoque-categorizado") || "[]");
  const existente = estoque.find((item: any) => item.nome.toLowerCase() === nome.toLowerCase());
  if (existente) {
    existente.quantidade -= quantidade;
    if (existente.quantidade <= 0) {
      const index = estoque.indexOf(existente);
      estoque.splice(index, 1);
    }
    localStorage.setItem("estoque-categorizado", JSON.stringify(estoque));
  }
}

// ✅ NOVO: Desconta estoque finalizando venda
export function descontarEstoque(produtosVendidos: { nome: string; quantidade: number }[]) {
  const estoque = JSON.parse(localStorage.getItem("estoque-categorizado") || "[]");

  for (const vendido of produtosVendidos) {
    if (!vendido || !vendido.nome || isNaN(vendido.quantidade) || vendido.quantidade <= 0) continue;

    const existente = estoque.find(
      (item: any) => item.nome.toLowerCase() === vendido.nome.toLowerCase()
    );
    if (existente) {
      existente.quantidade -= vendido.quantidade;
      if (existente.quantidade <= 0) {
        const index = estoque.indexOf(existente);
        estoque.splice(index, 1);
      }
    }
  }

  localStorage.setItem("estoque-categorizado", JSON.stringify(estoque));
}
