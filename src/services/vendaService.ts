import { Venda } from "../types/Venda";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { useFinanceiroStore } from "../store/useFinanceiroStore";
import { SyncService } from "./syncService";
import { salvarNoFirebase } from "./firebaseSync";
import { Transacao } from "../store/useFinanceiroStore";

/**
 * 🔥 ORQUESTRADOR DE VENDAS - OPERAÇÃO ATÔMICA
 */
export class VendaService {
  
  static async registrarVendaCompleta(venda: Venda): Promise<{ sucesso: boolean; erro?: string }> {
    const timestamp = new Date().toISOString();
    
    try {
      // 1. CAPTURAR ESTADO ATUAL
      const confeitariaState = useConfeitariaStore.getState();
      const financeiroState = useFinanceiroStore.getState();
      
      // 2. CALCULAR TOTAIS
      const totalVenda = (venda.itens || []).reduce((sum, item) => sum + item.valorTotal, 0);
      
      // 3. VALIDAR PRODUTOS EXISTEM E TEM ESTOQUE
      const produtosInvalidos = (venda.itens || []).filter(item => {
        const produto = confeitariaState.produtos.find(p => p.id === item.produtoId);
        return !produto || (produto.estoqueUnidades || 0) < (item.quantidade || 0);
      });
      
      if (produtosInvalidos.length > 0) {
        return { sucesso: false, erro: "Produtos indisponíveis ou sem estoque suficiente" };
      }
      
      // 4. ATUALIZAR ESTOQUE DOS PRODUTOS
      const produtosAtualizados = confeitariaState.produtos.map(produto => {
        const itemVenda = (venda.itens || []).find(item => item.produtoId === produto.id);
        if (!itemVenda) return produto;
        
        return {
          ...produto,
          estoqueUnidades: (produto.estoqueUnidades || 0) - (itemVenda.quantidade || 0),
          dataAtualizacao: timestamp
        };
      });
      
      // 5. PREPARAR VENDA COM TIMESTAMP
      const vendaComTimestamp = {
        ...venda,
        dataAtualizacao: timestamp,
        confirmado: true,
        dataConfirmacao: timestamp
      };
      
      // 6. PREPARAR TRANSAÇÃO FINANCEIRA
      const transacaoFinanceira: Transacao = {
        id: `venda_${venda.id}`,
        tipo: "entrada",
        descricao: `Venda - ${venda.cliente || 'Cliente não informado'}`,
        valor: totalVenda,
        data: venda.data
      };
      
      // 7. PREPARAR NOVOS ESTADOS
      const baseConfeitaria = SyncService.extrairDadosConfeitaria(confeitariaState);
      const novoEstadoConfeitaria = {
        ...baseConfeitaria,
        vendas: [...confeitariaState.vendas, vendaComTimestamp],
        produtos: produtosAtualizados,
        lastUpdate: timestamp
      };
      
      const novoEstadoFinanceiro = {
        ...financeiroState,
        transacoes: [...financeiroState.transacoes, transacaoFinanceira],
        saldo: financeiroState.saldo + totalVenda,
        lastUpdate: timestamp
      };
      
      // 8. SALVAR NO FIREBASE
      const [resultadoConfeitaria] = await Promise.all([
        SyncService.salvarConfeitaria(novoEstadoConfeitaria),
        salvarNoFirebase("financeiro", novoEstadoFinanceiro)
      ]);

      if (!resultadoConfeitaria.sucesso) {
        return { sucesso: false, erro: resultadoConfeitaria.erro || "Erro ao salvar confeitaria" };
      }
      
      // 9. ATUALIZAR STORES LOCAIS
      useConfeitariaStore.setState({
        vendas: novoEstadoConfeitaria.vendas,
        produtos: novoEstadoConfeitaria.produtos
      });
      
      useFinanceiroStore.setState({
        transacoes: novoEstadoFinanceiro.transacoes,
        saldo: novoEstadoFinanceiro.saldo
      });

      return { sucesso: true };
      
    } catch (error) {
      console.error("❌ Erro na operação atômica de venda:", error);
      return { 
        sucesso: false, 
        erro: error instanceof Error ? error.message : "Erro desconhecido" 
      };
    }
  }
  
  static validarVenda(venda: Venda): { valida: boolean; erros: string[] } {
    const erros: string[] = [];
    
    if (!venda.itens || venda.itens.length === 0) {
      erros.push("Pelo menos um item é obrigatório");
    }
    
    venda.itens?.forEach((item, index) => {
      if (!item.produtoId) {
        erros.push(`Item ${index + 1}: Produto não selecionado`);
      }
      if (item.quantidade <= 0) {
        erros.push(`Item ${index + 1}: Quantidade deve ser maior que zero`);
      }
      if (item.valorUnitario <= 0) {
        erros.push(`Item ${index + 1}: Valor deve ser maior que zero`);
      }
    });
    
    return { valida: erros.length === 0, erros };
  }
}