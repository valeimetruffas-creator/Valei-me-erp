// Tipos de documento fiscal para compras
export type TipoDocumentoCompra = "nfe" | "nfce" | "manual";

// Status da compra
export type StatusCompra = "pendente" | "confirmada" | "cancelada";

// Item dentro da compra (com informações de preço)
export interface ItemCompra {
  insumoId: string;
  quantidadeGramas: number;
  custoUnitario: number; // custo por grama
  custoTotal: number;
  unidade: "grama" | "unidade";
}

// Compra com campos profissionais
export interface Compra {
  id: string;
  fornecedor: string;
  data: string;
  
  // Campos profissionais (opcionais para compatibilidade)
  tipoDocumento?: TipoDocumentoCompra;
  numeroNota?: string;
  chaveNFe?: string;
  dataEmissao?: string;
  
  // Status e controle
  status?: StatusCompra;
  confirmado?: boolean;
  dataConfirmacao?: string;
  
  // Campos de cancelamento
  canceladoPor?: string;
  dataCancelamento?: string;
  motivoCancelamento?: string;
  
  // Campos de edição
  editada?: boolean;
  compraOriginalId?: string;
  
  // Auditoria
  dataAtualizacao?: string;
  
  itens: ItemCompra[];
}
