// Fornecedor de insumos para compras
export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  nomeContato?: string;
  celularContato?: string;
  
  // Status
  ativo: boolean;
  dataCadastro: string;
  
  // Estatísticas
  dataUltimaCompra?: string;
  totalCompras?: number;
  quantidadeCompras?: number;
  formaPagamentoPrincipal?: string;
}
