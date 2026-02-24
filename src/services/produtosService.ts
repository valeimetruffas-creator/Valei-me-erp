import { Produto } from "../types/Produto";
import { FichaTecnica } from "../types/FichaTecnica";
import { Insumo } from "../types/Insumo";
import { storage } from "./firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/**
 * Serviço para gerenciar operações de Produtos
 * Desacoplado de Ficha Técnica (produção)
 */

/**
 * Cria um novo produto
 */
export function criarProduto(dados: Partial<Produto>): Produto {
  return {
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nome: dados.nome || "Novo Produto",
    descricao: dados.descricao || "",
    categoria: dados.categoria || "Geral",
    precoVenda: dados.precoVenda || 0,
    foto: dados.foto,
    imagemUrl: dados.imagemUrl,
    ativo: dados.ativo !== false,
    fichaTecnicaId: dados.fichaTecnicaId,
    custoFicha: dados.custoFicha || 0,
    margemLucro: dados.margemLucro || 0,
    estoqueMinimo: dados.estoqueMinimo,
    ifoodProductId: dados.ifoodProductId || "",
    externalCode: dados.externalCode || "",
    dataCriacao: dados.dataCriacao || new Date().toISOString(),
  };
}

export async function uploadImagemProduto(file: File, produtoId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const extensao = file.name?.includes(".")
      ? file.name.substring(file.name.lastIndexOf("."))
      : ".jpg";
    const caminho = `produtos/${produtoId}/${timestamp}${extensao}`;
    const storageRef = ref(storage, caminho);

    await uploadBytes(storageRef, file, {
      contentType: file.type || "image/jpeg",
    });

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    throw new Error(error?.message || "Erro ao fazer upload da imagem do produto");
  }
}

export async function uploadImagemProdutoSeguro(
  file: File,
  produtoId: string
): Promise<{ sucesso: boolean; imagemUrl?: string; erro?: string }> {
  try {
    const imagemUrl = await uploadImagemProduto(file, produtoId);
    return { sucesso: true, imagemUrl };
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error?.message || "Erro ao fazer upload da imagem do produto",
    };
  }
}

function arredondar2(valor: number): number {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

function custoPorGramaInsumo(insumo?: Insumo): number {
  if (!insumo) return 0;
  if (typeof insumo.precoPorGrama === "number") return insumo.precoPorGrama;
  if (typeof insumo.precoPorKg === "number") return insumo.precoPorKg / 1000;
  return 0;
}

export function calcularPrecoAutomaticoDaFicha(
  produto: Produto,
  ficha: FichaTecnica | undefined,
  fichas: FichaTecnica[],
  insumos: Insumo[]
): Produto {
  if (!ficha) return produto;

  const custoTotal = ficha.itens.reduce((total, item) => {
    const quantidade = Number(item.quantidade ?? item.quantidadeGramas ?? 0);
    if (!Number.isFinite(quantidade) || quantidade <= 0) return total;

    if (item.tipo === "insumo") {
      const insumo = insumos.find(i => i.id === item.itemId || i.id === item.insumoId);
      return total + quantidade * custoPorGramaInsumo(insumo);
    }

    const fichaReferencia = fichas.find(f => f.id === item.itemId);
    return total + quantidade * Number(fichaReferencia?.custoUnitario || 0);
  }, 0);

  const rendimento = Number(ficha.rendimento || 0);
  const custoUnitario = rendimento > 0 ? custoTotal / rendimento : custoTotal;
  const margem = Number(
    ficha.margemLucro ?? produto.margemLucro ?? 0
  );
  const precoVendaCalculado = custoUnitario * (1 + margem / 100);

  return {
    ...produto,
    fichaTecnicaId: ficha.id,
    custoFicha: arredondar2(custoUnitario),
    margemLucro: arredondar2(margem),
    precoVenda: arredondar2(precoVendaCalculado),
  };
}

/**
 * Busca custo da ficha técnica e atualiza produto
 */
export function atualizarCustoFicha(
  produto: Produto,
  ficha: FichaTecnica | undefined
): Produto {
  if (!ficha) {
    return {
      ...produto,
      fichaTecnicaId: undefined,
      custoFicha: 0,
      margemLucro: 0,
    };
  }

  const custoFicha = ficha.custoUnitario || 0;
  const margemLucro = calcularMargemLucro(produto.precoVenda, custoFicha);

  return {
    ...produto,
    fichaTecnicaId: ficha.id,
    custoFicha,
    margemLucro,
  };
}

/**
 * Calcula margem de lucro em percentual
 */
export function calcularMargemLucro(
  precoVenda: number,
  custoFicha: number
): number {
  if (precoVenda <= 0) return 0;
  const margem = ((precoVenda - custoFicha) / precoVenda) * 100;
  return Math.round(margem * 100) / 100; // Arredonda para 2 casas
}

/**
 * Alterna status ativo/inativo sem recarregar
 */
export function alternarAtivoStatus(produto: Produto): Produto {
  return {
    ...produto,
    ativo: !produto.ativo,
  };
}

/**
 * Atualiza informações do produto
 */
export function atualizarProduto(
  produto: Produto,
  atualizacoes: Partial<Produto>
): Produto {
  return {
    ...produto,
    ...atualizacoes,
  };
}

/**
 * Calcula sugestão de preço baseado em margem desejada
 */
export function calcularPrecoComMargem(
  custoFicha: number,
  margemDesejada: number
): number {
  if (margemDesejada >= 100) return custoFicha * 2; // Evita divisão por zero
  const preco = custoFicha / (1 - margemDesejada / 100);
  return Math.round(preco * 100) / 100;
}

/**
 * Valida se produto pode ser deletado
 * (não deve estar vinculado a vendas)
 */
export function podeDeletarProduto(
  produto: Produto,
  vendasRelacionadas: number
): boolean {
  return vendasRelacionadas === 0;
}

/**
 * Formata produto para exibição
 */
export function formatarProdutoParaExibicao(produto: Produto) {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao || "Sem descrição",
    categoria: produto.categoria,
    precoVenda: `R$ ${produto.precoVenda.toFixed(2)}`,
    custoFicha: `R$ ${(produto.custoFicha || 0).toFixed(2)}`,
    margemLucro: `${(produto.margemLucro || 0).toFixed(1)}%`,
    status: produto.ativo ? "Ativo" : "Inativo",
    foto: produto.foto || null,
  };
}

/**
 * Calcula lucro unitário de um produto
 */
export function calcularLucroUnitario(produto: Produto): number {
  return Math.round((produto.precoVenda - (produto.custoFicha || 0)) * 100) / 100;
}

/**
 * Filtra produtos por critério
 */
export function filtrarProdutos(
  produtos: Produto[],
  criterio: {
    categoria?: string;
    ativo?: boolean;
    pesquisa?: string;
  }
): Produto[] {
  return produtos.filter((p) => {
    if (criterio.categoria && p.categoria !== criterio.categoria) return false;
    if (criterio.ativo !== undefined && p.ativo !== criterio.ativo) return false;
    if (
      criterio.pesquisa &&
      !p.nome.toLowerCase().includes(criterio.pesquisa.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Agrupa produtos por categoria
 */
export function agruparPorCategoria(produtos: Produto[]): Record<string, Produto[]> {
  return produtos.reduce(
    (acc, p) => {
      if (!acc[p.categoria]) acc[p.categoria] = [];
      acc[p.categoria].push(p);
      return acc;
    },
    {} as Record<string, Produto[]>
  );
}

/**
 * Calcula estatísticas de produtos
 */
export function calcularEstatisticas(produtos: Produto[]) {
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter((p) => p.ativo).length;
  const produtosInativos = totalProdutos - produtosAtivos;
  
  const margemMedia = produtos.length > 0
    ? produtos.reduce((sum, p) => sum + (p.margemLucro || 0), 0) / produtos.length
    : 0;

  const lucroTotalPotencial = produtos.reduce((sum, p) => {
    if (!p.ativo) return sum;
    return sum + calcularLucroUnitario(p);
  }, 0);

  return {
    totalProdutos,
    produtosAtivos,
    produtosInativos,
    margemMedia: Math.round(margemMedia * 100) / 100,
    lucroTotalPotencial: Math.round(lucroTotalPotencial * 100) / 100,
  };
}
