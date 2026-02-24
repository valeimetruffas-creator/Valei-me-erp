export type TipoIngrediente = "insumo" | "base" | "recheio";

export interface ItemFicha {
  tipo: TipoIngrediente;
  itemId: string;
  insumoId?: string; // Alias para itemId para compatibilidade
  quantidade: number;
  quantidadeGramas?: number; // Alias para quantidade para compatibilidade
}

export type CategoriaFicha = "base" | "recheio" | "montagem";

export interface FichaTecnica {
  id: string;
  nome: string;
  categoria: CategoriaFicha;
  rendimento: number;
  itens: ItemFicha[];
  custoTotal: number;
  custoUnitario: number;
  precoVenda: number;
  margemLucro: number;
}
