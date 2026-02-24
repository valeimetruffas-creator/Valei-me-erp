// utils/insumoUtils.ts
import { Insumo } from "../types/Insumo";
import { safeNumber, getPrecoPorGrama } from "./safeNumbers";

/**
 * Calcula o preço por grama com base no peso e preço da embalagem
 */
export const calcularPrecoPorGrama = (
  pesoEmbalagemGramas: number,
  precoEmbalagem: number
): number => {
  if (pesoEmbalagemGramas <= 0) return 0;
  return precoEmbalagem / pesoEmbalagemGramas;
};

/**
 * Calcula o estoque total em gramas
 */
export const calcularEstoqueGramas = (
  estoqueEmbalagens: number,
  pesoEmbalagemGramas: number
): number => {
  return estoqueEmbalagens * pesoEmbalagemGramas;
};

/**
 * Normaliza um insumo legado para o novo modelo
 * (compatibilidade com dados existentes)
 */
export const normalizarInsumo = (insumo: Partial<Insumo>): Insumo => {
  // Se já tem campos de embalagem, usa-os
  if (insumo.pesoEmbalagemGramas && insumo.precoEmbalagem) {
    return {
      id: insumo.id || crypto.randomUUID(),
      nome: insumo.nome || "",
      categoria: insumo.categoria || "insumo",
      pesoEmbalagemGramas: insumo.pesoEmbalagemGramas,
      precoEmbalagem: insumo.precoEmbalagem,
      estoqueEmbalagens: insumo.estoqueEmbalagens || 0,
      estoqueGramas: calcularEstoqueGramas(
        insumo.estoqueEmbalagens || 0,
        insumo.pesoEmbalagemGramas
      ),
      precoPorGrama: calcularPrecoPorGrama(
        insumo.pesoEmbalagemGramas,
        insumo.precoEmbalagem
      ),
      minimoGramas: insumo.minimoGramas || 1000,
      dataCadastro: insumo.dataCadastro || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };
  }

  // Migração de dados antigos: se só tem precoPorKg
  if (insumo.precoPorKg && !insumo.pesoEmbalagemGramas) {
    // Assume padrão de 1kg (1000g) para compatibilidade
    const pesoEmbalagemGramas = 1000;
    const precoEmbalagem = insumo.precoPorKg;

    return {
      id: insumo.id || crypto.randomUUID(),
      nome: insumo.nome || "",
      categoria: insumo.categoria || "insumo",
      pesoEmbalagemGramas,
      precoEmbalagem,
      estoqueEmbalagens: (insumo.estoqueGramas || 0) / pesoEmbalagemGramas,
      estoqueGramas: insumo.estoqueGramas || 0,
      precoPorGrama: precoEmbalagem / pesoEmbalagemGramas,
      minimoGramas: insumo.minimoGramas || 1000,
      precoPorKg: insumo.precoPorKg, // mantém campo legado
      dataCadastro: insumo.dataCadastro,
      dataAtualizacao: new Date().toISOString(),
    };
  }

  // Fallback: cria insumo vazio
  return {
    id: insumo.id || crypto.randomUUID(),
    nome: insumo.nome || "",
    categoria: insumo.categoria || "insumo",
    pesoEmbalagemGramas: 1000,
    precoEmbalagem: 0,
    estoqueEmbalagens: 0,
    estoqueGramas: 0,
    precoPorGrama: 0,
    minimoGramas: insumo.minimoGramas || 1000,
    dataCadastro: insumo.dataCadastro || new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
  };
};

/**
 * Atualiza um insumo recalculando campos dependentes
 */
export const atualizarInsumo = (
  insumo: Insumo,
  atualizacoes: Partial<Insumo>
): Insumo => {
  const atualizado = { ...insumo, ...atualizacoes };

  // Recalcula campos derivados se peso ou preço mudar
  if (atualizacoes.pesoEmbalagemGramas !== undefined || atualizacoes.precoEmbalagem !== undefined) {
    atualizado.precoPorGrama = calcularPrecoPorGrama(
      atualizado.pesoEmbalagemGramas || 0,
      atualizado.precoEmbalagem || 0
    );
    atualizado.estoqueGramas = calcularEstoqueGramas(
      atualizado.estoqueEmbalagens || 0,
      atualizado.pesoEmbalagemGramas || 0
    );
  }

  // Se estoque em embalagens muda, recalcula gramas
  if (atualizacoes.estoqueEmbalagens !== undefined) {
    atualizado.estoqueGramas = calcularEstoqueGramas(
      atualizado.estoqueEmbalagens || 0,
      atualizado.pesoEmbalagemGramas || 0
    );
  }

  atualizado.dataAtualizacao = new Date().toISOString();
  return atualizado;
};

/**
 * Adiciona quantidade de embalagens ao estoque
 */
export const adicionarEmbalagens = (
  insumo: Insumo,
  quantidade: number
): Insumo => {
  return atualizarInsumo(insumo, {
    estoqueEmbalagens: (insumo.estoqueEmbalagens || 0) + quantidade,
  });
};

/**
 * Remove quantidade de embalagens do estoque
 */
export const removerEmbalagens = (
  insumo: Insumo,
  quantidade: number
): Insumo => {
  const novaQuantidade = Math.max(0, (insumo.estoqueEmbalagens || 0) - quantidade);
  return atualizarInsumo(insumo, {
    estoqueEmbalagens: novaQuantidade,
  });
};

/**
 * Valida se um insumo está abaixo do estoque mínimo
 */
export const estoqueBaixo = (insumo: Insumo): boolean => {
  return (insumo.estoqueGramas || 0) < (insumo.minimoGramas || 0);
};

/**
 * Formata exibição de embalagens
 */
export const formatarEmbalagens = (quantidade: number): string => {
  return `${quantidade} emb.`;
};
