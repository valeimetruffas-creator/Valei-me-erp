import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Insumo } from "../types/Insumo";
import { FichaTecnica } from "../types/FichaTecnica";
import { Produto } from "../types/Produto";
import { Compra } from "../types/Compra";
import { Venda } from "../types/Venda";
import { Fornecedor } from "../types/Fornecedor";
import { CupomFiscal } from "../types/CupomFiscal";
import { normalizarInsumo, atualizarInsumo } from "../utils/insumoUtils";
import { carregarDoFirebase } from "../services/firebaseSync";
import { SyncService } from "../services/syncService";

function validarProdutoNome(nome?: string) {
  if (!nome || nome.trim().length < 2) {
    throw new Error("Nome do produto inválido.");
  }
}

async function salvarSeguro(dados: any) {
  try {
    // Sempre salvar no Firebase se disponível
    if (SyncService.isFirebaseDisponivel()) {
      const dadosLimpos = SyncService.extrairDadosConfeitaria(dados);
      const resultado = await SyncService.salvarConfeitaria(dadosLimpos);
      if (!resultado.sucesso) {
        throw new Error(resultado.erro || "Erro ao salvar confeitaria");
      }
    }
  } catch (e) {
    console.warn("Dados salvos localmente. Sincronização pendente.");
  }
}

interface State {
  insumos: Insumo[];
  fichas: FichaTecnica[];
  produtos: Produto[];
  compras: Compra[];
  vendas: Venda[];
  fornecedores: Fornecedor[];
  cuponsFiscais: CupomFiscal[];
  producoes: any[]; // Produções para compatibilidade

  addInsumo(insumo: Insumo): void;
  updateInsumo(insumo: Insumo): void;
  removeInsumo(id: string): void;

  addFicha(ficha: FichaTecnica): void;
  updateFicha(ficha: FichaTecnica): void;
  removeFicha(id: string): void;

  addProduto(produto: Produto): void;
  updateProduto(produto: Produto): void;
  removeProduto(id: string): void;
  alternarAtivoStatusProduto(id: string): void;
  vincularFichaTecnicaProduto(produtoId: string, fichaTecnicaId?: string): void;

  registrarCompra(compra: Compra): void;
  confirmarCompra(compraId: string): void;

  addFornecedor(fornecedor: Fornecedor): void;
  updateFornecedor(fornecedor: Fornecedor): void;
  removeFornecedor(id: string): void;

  registrarCupomFiscal(cupom: CupomFiscal): void;
  cancelarCupomFiscal(cupomId: string, motivo: string): void;

  produzirProduto(fichaId: string, quantidade: number): void;
  registrarVenda(venda: Venda): void;

  carregarDadosFirebase(): Promise<void>;
  inicializarSincronizacao(): Promise<void>;
}

export const useConfeitariaStore = create<State>()(
  persist(
    (set, get) => ({
      insumos: [],
      fichas: [],
      produtos: [],
      compras: [],
      vendas: [],
      fornecedores: [],
      cuponsFiscais: [],
      producoes: [],

      addInsumo: (insumo) => {
        const insumoNormalizado = normalizarInsumo(insumo);
        set({ insumos: [...get().insumos, insumoNormalizado] });
        salvarSeguro(get());
      },

      updateInsumo: (insumo) => {
        set({
          insumos: get().insumos.map(i =>
            i.id === insumo.id ? atualizarInsumo(i, insumo) : i
          )
        });
        salvarSeguro(get());
      },

      removeInsumo: (id) => {
        set({ insumos: get().insumos.filter(i => i.id !== id) });
        salvarSeguro(get());
      },

      addFicha: (ficha) => {
        set({ fichas: [...get().fichas, ficha] });
        salvarSeguro(get());
      },

      updateFicha: (ficha) => {
        set({ fichas: get().fichas.map(f => f.id === ficha.id ? ficha : f) });
        salvarSeguro(get());
      },

      removeFicha: (id) => {
        set({ fichas: get().fichas.filter(f => f.id !== id) });
        salvarSeguro(get());
      },

      addProduto: (produto) => {
        try {
          validarProdutoNome(produto.nome);
          set({ produtos: [...get().produtos, produto] });
          salvarSeguro(get());
        } catch (error) {
          console.warn(error instanceof Error ? error.message : "Falha ao adicionar produto");
        }
      },

      updateProduto: (produto) => {
        try {
          validarProdutoNome(produto.nome);
          set({ produtos: get().produtos.map(p => p.id === produto.id ? produto : p) });
          salvarSeguro(get());
        } catch (error) {
          console.warn(error instanceof Error ? error.message : "Falha ao atualizar produto");
        }
      },

      removeProduto: (id) => {
        set({ produtos: get().produtos.filter(p => p.id !== id) });
        salvarSeguro(get());
      },

      alternarAtivoStatusProduto: (id) => {
        set({
          produtos: get().produtos.map(p =>
            p.id === id ? { ...p, ativo: !p.ativo } : p
          )
        });
        salvarSeguro(get());
      },

      vincularFichaTecnicaProduto: (produtoId, fichaTecnicaId) => {
        const produtos = [...get().produtos];
        const produtoIdx = produtos.findIndex(p => p.id === produtoId);
        if (produtoIdx === -1) return;

        const produto = produtos[produtoIdx];
        produtos[produtoIdx] = {
          ...produto,
          fichaTecnicaId,
        };

        set({ produtos });
        salvarSeguro(get());
      },

      carregarDadosFirebase: async () => {
        try {
          const dados = await carregarDoFirebase("confeitaria");
          if (dados) {
            set(dados);
          }
        } catch (error) {
          console.warn("Falha ao carregar do Firebase:", error);
        }
      },

      inicializarSincronizacao: async () => {
        try {
          if (SyncService.isFirebaseDisponivel() && SyncService.needsSync()) {
            const estadoAtual = get();
            const sucesso = await SyncService.sincronizarLocalParaNuvem(estadoAtual);
            
            if (sucesso) {
              // Recarregar dados sincronizados
              const dadosSincronizados = await SyncService.carregarDaNuvem();
              if (dadosSincronizados) {
                set(dadosSincronizados);
              }
            }
          }
        } catch (error) {
          console.warn("Falha na inicialização da sincronização:", error);
        }
      },

      // 🔥 FUNÇÃO PASSIVA - SEM LÓGICA DE NEGÓCIO
      registrarCompra: (compra) => {
        set({ compras: [...get().compras, compra] });
        salvarSeguro(get());
      },

      confirmarCompra: (compraId) => {
        const compras = get().compras.map(c => 
          c.id === compraId ? { ...c, status: 'confirmada' as const } : c
        );
        set({ compras });
        salvarSeguro(get());
      },

      addFornecedor: (fornecedor) => {
        set({ fornecedores: [...get().fornecedores, fornecedor] });
        salvarSeguro(get());
      },

      updateFornecedor: (fornecedor) => {
        set({ 
          fornecedores: get().fornecedores.map(f => 
            f.id === fornecedor.id ? fornecedor : f
          ) 
        });
        salvarSeguro(get());
      },

      removeFornecedor: (id) => {
        set({ fornecedores: get().fornecedores.filter(f => f.id !== id) });
        salvarSeguro(get());
      },

      registrarCupomFiscal: (cupom) => {
        set({ cuponsFiscais: [...get().cuponsFiscais, cupom] });
        salvarSeguro(get());
      },

      cancelarCupomFiscal: (cupomId, motivo) => {
        const cupons = get().cuponsFiscais.map(c => 
          c.id === cupomId ? { ...c, status: 'cancelado' as const, motivoCancelamento: motivo } : c
        );
        set({ cuponsFiscais: cupons });
        salvarSeguro(get());
      },

      produzirProduto: (fichaId, quantidade) => {
        // Implementação da produção
        salvarSeguro(get());
      },

      registrarVenda: (venda) => {
        set({ vendas: [...get().vendas, venda] });
        salvarSeguro(get());
        // Removido: callback onVendaRegistrada (agora controlado por service)
      },
    }),
    { name: "valeime-confeitaria" }
  )
);
