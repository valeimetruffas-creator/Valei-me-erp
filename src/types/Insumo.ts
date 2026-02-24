export interface Insumo {
  id: string;
  nome: string;
  categoria?: 'insumo' | 'embalagem';

  // === CAMPO LEGADO (compatibilidade) ===
  precoPorKg?: number;
  estoqueMinimo?: number; // Alias para minimoGramas

  // === CAMPOS DE EMBALAGEM (modelo profissional) ===
  pesoEmbalagemGramas?: number;        // Ex: 200g
  precoEmbalagem?: number;              // Ex: 3.99
  
  // === CAMPOS CALCULADOS E GERENCIADOS ===
  estoqueEmbalagens?: number;           // Quantidade de embalagens em estoque
  estoqueGramas?: number;               // Calculado: estoqueEmbalagens * pesoEmbalagemGramas
  precoPorGrama?: number;               // Calculado: precoEmbalagem / pesoEmbalagemGramas
  
  // === CONTROLE ===
  minimoGramas?: number;                // Estoque mínimo em gramas
  dataCadastro?: string;
  dataAtualizacao?: string;
}