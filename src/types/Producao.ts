export interface Producao {
  id: string;
  fichaId: string;
  quantidade: number;
  data: string;
  custoTotal: number;
  observacoes?: string;
  
  // Campos para compatibilidade
  produtoId?: string;
  quantidadeProduzida?: number;
}