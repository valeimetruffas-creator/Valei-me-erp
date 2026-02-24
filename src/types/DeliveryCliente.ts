export type StatusPedidoDelivery = "pendente" | "aceito" | "preparando" | "saiu" | "saiu_entrega" | "entregue";

export interface ProdutoCardapio {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  precoVenda: number;
  imagemUrl: string;
  ativo: boolean;
  estoqueUnidades: number;
  destaque: boolean;
}

export interface ItemCarrinhoDelivery {
  produtoId: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  observacao: string;
  imagemUrl: string;
}

export interface CheckoutDelivery {
  cliente: {
    nome: string;
    whatsapp: string;
  };
  endereco: {
    tipo: "entrega" | "retirada";
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    referencia?: string;
    cep?: string;
  };
  pagamento: {
    tipo: "dinheiro" | "pix" | "cartao";
    trocoPara?: number;
  };
  observacao: string;
}

export interface PedidoDelivery {
  id: string;
  cliente: string;
  itens: Array<{
    produtoId: string;
    nome: string;
    quantidade: number;
    precoUnitario: number;
    observacao?: string;
  }>;
  total: number;
  origem: "delivery" | "ifood";
  status: StatusPedidoDelivery;
  criadoEmIso?: string;
  atualizadoEm?: string;
  tempoEstimadoMinutos?: number;
  observacao?: string;
  pagamento?: {
    tipo: "dinheiro" | "pix" | "cartao";
    trocoPara?: number;
  };
  endereco?: {
    tipo: "entrega" | "retirada";
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    referencia?: string;
    cep?: string;
  };
}
