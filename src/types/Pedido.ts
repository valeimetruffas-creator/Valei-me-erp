export type StatusPedido = "pendente" | "aceito" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";

export interface ItemPedido {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: string;
  cliente: string;
  itens: ItemPedido[];
  valor: number;
  status: StatusPedido;
  origem: "ifood" | "delivery";
  atualizadoEm?: string;
  recebidoEm?: string;
  estoqueBaixado?: boolean;
}
