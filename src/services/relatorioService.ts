import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { useFinanceiroStore } from "../store/useFinanceiroStore";

export interface RelatorioFinanceiro {
  periodo: { inicio: Date; fim: Date };
  receitas: {
    vendas: number;
    total: number;
  };
  despesas: {
    compras: number;
    outras: number;
    total: number;
  };
  lucro: number;
  margemLucro: number;
}

export interface RelatorioEstoque {
  insumos: {
    id: string;
    nome: string;
    estoqueAtual: number;
    valorEstoque: number;
    status: 'critico' | 'baixo' | 'normal';
  }[];
  produtos: {
    id: string;
    nome: string;
    estoqueAtual: number;
    valorEstoque: number;
  }[];
  valorTotalEstoque: number;
}

export interface RelatorioProdutividade {
  periodo: { inicio: Date; fim: Date };
  producoes: {
    produtoId: string;
    nomeProduto: string;
    quantidadeProduzida: number;
    custoProducao: number;
  }[];
  vendas: {
    produtoId: string;
    nomeProduto: string;
    quantidadeVendida: number;
    receitaGerada: number;
  }[];
}

/**
 * 📊 GERADOR DE RELATÓRIOS E ANÁLISES
 */
export class RelatorioService {
  
  /**
   * Relatório financeiro por período
   */
  static gerarRelatorioFinanceiro(inicio: Date, fim: Date): RelatorioFinanceiro {
    const financeiroState = useFinanceiroStore.getState();
    
    const transacoesPeriodo = financeiroState.transacoes.filter(t => {
      const dataTransacao = new Date(t.data);
      return dataTransacao >= inicio && dataTransacao <= fim;
    });
    
    const receitas = transacoesPeriodo
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const despesas = transacoesPeriodo
      .filter(t => t.tipo === 'saida' || t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const lucro = receitas - despesas;
    const margemLucro = receitas > 0 ? (lucro / receitas) * 100 : 0;
    
    return {
      periodo: { inicio, fim },
      receitas: {
        vendas: receitas,
        total: receitas
      },
      despesas: {
        compras: despesas,
        outras: 0,
        total: despesas
      },
      lucro,
      margemLucro
    };
  }
  
  /**
   * Relatório de estoque atual
   */
  static gerarRelatorioEstoque(): RelatorioEstoque {
    const confeitariaState = useConfeitariaStore.getState();
    
    const insumos = confeitariaState.insumos.map(insumo => {
      const estoqueAtual = insumo.estoqueGramas || 0;
      const valorEstoque = estoqueAtual * (insumo.precoPorGrama || 0);
      
      let status: 'critico' | 'baixo' | 'normal' = 'normal';
      if (estoqueAtual <= (insumo.estoqueMinimo || 0)) {
        status = 'critico';
      } else if (estoqueAtual <= (insumo.estoqueMinimo || 0) * 2) {
        status = 'baixo';
      }
      
      return {
        id: insumo.id,
        nome: insumo.nome,
        estoqueAtual,
        valorEstoque,
        status
      };
    });
    
    const produtos = confeitariaState.produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      estoqueAtual: produto.estoqueUnidades || 0,
      valorEstoque: (produto.estoqueUnidades || 0) * (produto.precoVenda || 0)
    }));
    
    const valorTotalEstoque = [
      ...insumos.map(i => i.valorEstoque),
      ...produtos.map(p => p.valorEstoque)
    ].reduce((sum, valor) => sum + valor, 0);
    
    return {
      insumos,
      produtos,
      valorTotalEstoque
    };
  }
  
  /**
   * Relatório de produtividade por período
   */
  static gerarRelatorioProdutividade(inicio: Date, fim: Date): RelatorioProdutividade {
    const confeitariaState = useConfeitariaStore.getState();
    
    const producoesPeriodo = confeitariaState.producoes.filter(p => {
      const dataProducao = new Date(p.data);
      return dataProducao >= inicio && dataProducao <= fim;
    });
    
    const vendasPeriodo = confeitariaState.vendas.filter(v => {
      const dataVenda = new Date(v.data);
      return dataVenda >= inicio && dataVenda <= fim;
    });
    
    // Agrupar produções por produto
    const producoesPorProduto = new Map<string, { quantidade: number; custo: number }>();
    producoesPeriodo.forEach(producao => {
      const atual = producoesPorProduto.get(producao.produtoId) || { quantidade: 0, custo: 0 };
      producoesPorProduto.set(producao.produtoId, {
        quantidade: atual.quantidade + producao.quantidadeProduzida,
        custo: atual.custo + (producao.custoProducao || 0)
      });
    });
    
    // Agrupar vendas por produto
    const vendasPorProduto = new Map<string, { quantidade: number; receita: number }>();
    vendasPeriodo.forEach(venda => {
      (venda.itens || []).forEach(item => {
        const atual = vendasPorProduto.get(item.produtoId) || { quantidade: 0, receita: 0 };
        vendasPorProduto.set(item.produtoId, {
          quantidade: atual.quantidade + item.quantidade,
          receita: atual.receita + item.valorTotal
        });
      });
    });
    
    const producoes = Array.from(producoesPorProduto.entries()).map(([produtoId, dados]) => {
      const produto = confeitariaState.produtos.find(p => p.id === produtoId);
      return {
        produtoId,
        nomeProduto: produto?.nome || 'Produto não encontrado',
        quantidadeProduzida: dados.quantidade,
        custoProducao: dados.custo
      };
    });
    
    const vendas = Array.from(vendasPorProduto.entries()).map(([produtoId, dados]) => {
      const produto = confeitariaState.produtos.find(p => p.id === produtoId);
      return {
        produtoId,
        nomeProduto: produto?.nome || 'Produto não encontrado',
        quantidadeVendida: dados.quantidade,
        receitaGerada: dados.receita
      };
    });
    
    return {
      periodo: { inicio, fim },
      producoes,
      vendas
    };
  }
  
  /**
   * Produtos mais vendidos
   */
  static getProdutosMaisVendidos(limite: number = 5): Array<{
    produtoId: string;
    nome: string;
    quantidadeVendida: number;
    receita: number;
  }> {
    const confeitariaState = useConfeitariaStore.getState();
    
    const vendasPorProduto = new Map<string, { quantidade: number; receita: number }>();
    
    confeitariaState.vendas.forEach(venda => {
      (venda.itens || []).forEach(item => {
        const atual = vendasPorProduto.get(item.produtoId) || { quantidade: 0, receita: 0 };
        vendasPorProduto.set(item.produtoId, {
          quantidade: atual.quantidade + item.quantidade,
          receita: atual.receita + item.valorTotal
        });
      });
    });
    
    return Array.from(vendasPorProduto.entries())
      .map(([produtoId, dados]) => {
        const produto = confeitariaState.produtos.find(p => p.id === produtoId);
        return {
          produtoId,
          nome: produto?.nome || 'Produto não encontrado',
          quantidadeVendida: dados.quantidade,
          receita: dados.receita
        };
      })
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
      .slice(0, limite);
  }
  
  /**
   * Insumos com estoque crítico
   */
  static getInsumosEstoqueCritico(): Array<{
    id: string;
    nome: string;
    estoqueAtual: number;
    estoqueMinimo: number;
  }> {
    const confeitariaState = useConfeitariaStore.getState();
    
    return confeitariaState.insumos
      .filter(insumo => (insumo.estoqueGramas || 0) <= (insumo.estoqueMinimo || 0))
      .map(insumo => ({
        id: insumo.id,
        nome: insumo.nome,
        estoqueAtual: insumo.estoqueGramas || 0,
        estoqueMinimo: insumo.estoqueMinimo || 0
      }));
  }
}