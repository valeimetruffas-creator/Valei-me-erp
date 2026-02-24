export type TipoVenda = "pdv" | "completo" | "delivery";
export type OrigemVenda = "sistema" | "ifood" | "site";

export interface ClienteVenda {
  nome: string;
  telefone: string;
  endereco: string;
}

export interface ItemVendaPadrao {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  produtoId?: string;
}

export interface Venda {
  id: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  data: string;
  
  // Campos adicionais para compatibilidade
  itens?: ItemVendaPadrao[];
  cliente?: string | ClienteVenda | null;
  fichaId?: string; // ID da ficha técnica
  tipoVenda: TipoVenda;
  origemVenda: OrigemVenda;
}
