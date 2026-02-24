// Estrutura de cupom fiscal para o sistema
export type FormaPagamento = "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "boleto" | "cheque";
export type StatusCupom = "rascunho" | "emitido" | "cancelado";

export interface ItemCupom {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface CupomFiscal {
  id: string;
  numero: number;
  serie: number;
  dataCupom: string;
  
  itens: ItemCupom[];
  subtotal: number;
  desconto?: number;
  acrescimo?: number;
  total: number;
  
  formaPagamento: FormaPagamento;
  status: StatusCupom;
  
  dataCancelamento?: string;
  motivoCancelamento?: string;
  
  // Ligação com venda
  vendaId?: string;
  
  // Campos para futura integração SEFAZ
  dadosSEFAZ?: DadosSEFAZ;
}

// Dados estruturados para integração com SEFAZ (futura)
export interface DadosSEFAZ {
  ambiente?: "producao" | "homologacao";
  certificado?: string;
  protocoloNFe?: string;
  statusSEFAZ?: "nao_enviado" | "enviado" | "autorizado" | "rejeitado";
  dataAutorizacaoSEFAZ?: string;
}
