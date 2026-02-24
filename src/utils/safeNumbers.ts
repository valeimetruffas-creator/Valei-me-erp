// utils/safeNumbers.ts

/**
 * Converte um valor para número seguro
 * Retorna 0 se o valor for undefined, null ou NaN
 */
export function safeNumber(value: number | undefined | null): number {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  return 0;
}

/**
 * Formata um número com casas decimais seguras
 */
export function safeFixed(value: number | undefined | null, decimais: number = 2): string {
  return safeNumber(value).toFixed(decimais);
}

/**
 * Retorna o preço por grama com fallback para dados antigos
 * Se precoPorGrama não existe, calcula a partir de precoPorKg
 */
export function getPrecoPorGrama(insumo: {
  precoPorGrama?: number;
  precoPorKg?: number;
  pesoEmbalagemGramas?: number;
  precoEmbalagem?: number;
}): number {
  // Novo modelo: usa precoPorGrama calculado
  if (insumo.precoPorGrama !== undefined && !isNaN(insumo.precoPorGrama)) {
    return insumo.precoPorGrama;
  }

  // Fallback para novo modelo: calcula do preço da embalagem
  if (
    insumo.precoEmbalagem !== undefined &&
    insumo.pesoEmbalagemGramas !== undefined &&
    insumo.pesoEmbalagemGramas > 0
  ) {
    return insumo.precoEmbalagem / insumo.pesoEmbalagemGramas;
  }

  // Fallback para modelo antigo: converte precoPorKg
  if (insumo.precoPorKg !== undefined && !isNaN(insumo.precoPorKg)) {
    return insumo.precoPorKg / 1000;
  }

  // Nenhum preço disponível
  return 0;
}

/**
 * Valida se um insumo tem informações de preço válidas
 */
export function temPrecoValido(insumo: {
  precoPorGrama?: number;
  precoPorKg?: number;
  pesoEmbalagemGramas?: number;
  precoEmbalagem?: number;
}): boolean {
  return getPrecoPorGrama(insumo) > 0;
}

/**
 * Calcula o custo de um item com segurança
 */
export function calcularCustoSeguro(
  quantidadeGramas: number | undefined,
  precoPorGrama: number | undefined
): number {
  const qtd = safeNumber(quantidadeGramas);
  const preco = safeNumber(precoPorGrama);
  return qtd * preco;
}
