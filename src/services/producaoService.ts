import { Producao } from "../types/Producao";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { SyncService } from "./syncService";
import { registrarProducaoSegura } from "./backendService";

/**
 * 🔥 ORQUESTRADOR DE PRODUÇÃO - OPERAÇÃO ATÔMICA
 */
export class ProducaoService {
  
  static async registrarProducaoCompleta(producao: Producao): Promise<{ sucesso: boolean; erro?: string }> {
    const timestamp = new Date().toISOString();
    
    try {
      try {
        const resposta: any = await registrarProducaoSegura({ producao });
        const dados = resposta?.data as { sucesso?: boolean; erro?: string } | undefined;
        if (dados?.sucesso) {
          return { sucesso: true };
        }
        if (dados && dados.sucesso === false) {
          return { sucesso: false, erro: dados.erro || "Falha no backend" };
        }
      } catch (erroBackend) {
        console.warn("⚠️ Backend de produção indisponível. Usando fluxo local.", erroBackend);
      }

      // 1. CAPTURAR ESTADO ATUAL
      const confeitariaState = useConfeitariaStore.getState();
      
      // 2. VALIDAR PRODUTO EXISTE
      const produto = confeitariaState.produtos.find(p => p.id === producao.produtoId);
      if (!produto) {
        return { sucesso: false, erro: "Produto não encontrado" };
      }
      
      // 3. VALIDAR INSUMOS SUFICIENTES
      const insumosInsuficientes = produto.receita?.filter(ingrediente => {
        const insumo = confeitariaState.insumos.find(i => i.id === ingrediente.insumoId);
        const quantidadeNecessaria = ingrediente.quantidadeGramas * (producao.quantidadeProduzida || 0);
        return !insumo || (insumo.estoqueGramas || 0) < quantidadeNecessaria;
      }) || [];
      
      if (insumosInsuficientes.length > 0) {
        return { sucesso: false, erro: "Insumos insuficientes para produção" };
      }
      
      // 4. ATUALIZAR ESTOQUE DE INSUMOS (CONSUMIR)
      const insumosAtualizados = confeitariaState.insumos.map(insumo => {
        const ingrediente = produto.receita?.find(r => r.insumoId === insumo.id);
        if (!ingrediente) return insumo;
        
        const quantidadeConsumida = ingrediente.quantidadeGramas * (producao.quantidadeProduzida || 0);
        const novoEstoque = (insumo.estoqueGramas || 0) - quantidadeConsumida;
        
        return {
          ...insumo,
          estoqueGramas: Math.max(0, novoEstoque),
          estoqueEmbalagens: (insumo.pesoEmbalagemGramas || 0) > 0 
            ? Math.ceil(Math.max(0, novoEstoque) / (insumo.pesoEmbalagemGramas || 1)) 
            : 0,
          dataAtualizacao: timestamp
        };
      });
      
      // 5. ATUALIZAR ESTOQUE DO PRODUTO (ADICIONAR)
      const produtosAtualizados = confeitariaState.produtos.map(p => {
        if (p.id !== producao.produtoId) return p;
        
        return {
          ...p,
          estoqueUnidades: (p.estoqueUnidades || 0) + (producao.quantidadeProduzida || 0),
          dataAtualizacao: timestamp
        };
      });
      
      // 6. PREPARAR PRODUÇÃO COM TIMESTAMP
      const producaoComTimestamp = {
        ...producao,
        dataAtualizacao: timestamp,
        confirmado: true,
        dataConfirmacao: timestamp
      };
      
      // 7. PREPARAR NOVO ESTADO
      const baseConfeitaria = SyncService.extrairDadosConfeitaria(confeitariaState);
      const novoEstadoConfeitaria = {
        ...baseConfeitaria,
        producoes: [...confeitariaState.producoes, producaoComTimestamp],
        insumos: insumosAtualizados,
        produtos: produtosAtualizados,
        lastUpdate: timestamp
      };
      
      // 8. SALVAR NO FIREBASE
      const { sucesso, erro } = await SyncService.salvarConfeitaria(novoEstadoConfeitaria);

      if (!sucesso) {
        return { sucesso: false, erro: erro || "Erro ao salvar producao" };
      }
      
      // 9. ATUALIZAR STORE LOCAL
      useConfeitariaStore.setState({
        producoes: novoEstadoConfeitaria.producoes,
        insumos: novoEstadoConfeitaria.insumos,
        produtos: novoEstadoConfeitaria.produtos
      });

      return { sucesso: true };
      
    } catch (error) {
      console.error("❌ Erro na operação atômica de produção:", error);
      return { 
        sucesso: false, 
        erro: error instanceof Error ? error.message : "Erro desconhecido" 
      };
    }
  }
  
  static validarProducao(producao: Producao): { valida: boolean; erros: string[] } {
    const erros: string[] = [];
    
    if (!producao.produtoId) {
      erros.push("Produto é obrigatório");
    }
    
    if ((producao.quantidadeProduzida || 0) <= 0) {
      erros.push("Quantidade deve ser maior que zero");
    }
    
    return { valida: erros.length === 0, erros };
  }
  
  /**
   * Calcular custo de produção baseado nos insumos
   */
  static calcularCustoProducao(produtoId: string, quantidade: number): number {
    const confeitariaState = useConfeitariaStore.getState();
    const produto = confeitariaState.produtos.find(p => p.id === produtoId);
    
    if (!produto?.receita) return 0;
    
    return produto.receita.reduce((custoTotal, ingrediente) => {
      const insumo = confeitariaState.insumos.find(i => i.id === ingrediente.insumoId);
      if (!insumo) return custoTotal;
      
      const custoIngrediente = ingrediente.quantidadeGramas * (insumo.precoPorGrama || 0) * quantidade;
      return custoTotal + custoIngrediente;
    }, 0);
  }
}