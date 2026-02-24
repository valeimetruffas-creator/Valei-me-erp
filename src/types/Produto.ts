export interface Produto {
  id: string;
  nome: string;
  descricao?: string; // Descrição curta para exibição
  categoria: string; // ex: "Bolos", "Doces", "Cupcakes"
  precoVenda: number; // Preço de venda final
  foto?: string; // URL ou base64 da imagem
  imagemUrl?: string; // URL pública da imagem no Firebase Storage
  ativo: boolean; // true = visível em vendas | false = oculto
  
  // Relacionamento com Ficha Técnica
  fichaTecnicaId?: string; // ID da ficha técnica vinculada
  custoFicha?: number; // Custo automaticamente buscado da ficha
  margemLucro?: number; // Porcentagem calculada (preço - custo) / preço
  
  // Controle de estoque
  estoqueMinimo?: number; // Quantidade mínima recomendada
  estoqueUnidades?: number; // Estoque atual em unidades
  receita?: unknown[]; // Receita/ingredientes para compatibilidade

  // Integração iFood
  ifoodProductId?: string;
  externalCode?: string;
  
  // Campos legados (mantidos para compatibilidade)
  fichaId?: string;
  quantidade?: number;
  custoUnitario?: number;
  validade?: string;
  lote?: string;
  dataCriacao?: string;
}
