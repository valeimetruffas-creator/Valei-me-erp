export interface ProdutoNaoMapeado {
  id: string;
  pedidoId: string;
  itemId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  ifoodProductId?: string;
  externalCode?: string;
  status: "pendente" | "vinculado";
  tentativas: number;
  recebidoEm?: string;
  atualizadoEm?: string;
  produtoIdInterno?: string;
  produtoNomeInterno?: string;
}
