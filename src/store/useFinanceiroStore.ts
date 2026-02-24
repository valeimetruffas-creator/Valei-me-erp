import { create } from "zustand";
import { persist } from "zustand/middleware";
import { salvarNoFirebase, carregarDoFirebase } from "../services/firebaseSync";

function validarValor(valor: number) {
  if (isNaN(valor) || valor <= 0) {
    throw new Error("Valor inválido.");
  }
}

async function salvarSeguroFinanceiro(dados: any) {
  try {
    await salvarNoFirebase("financeiro", dados);
  } catch (e) {
    console.error("Erro Firebase:", e);
    console.warn("Financeiro salvo apenas localmente.");
  }
}

export type Transacao = {
  id: string;
  tipo: "entrada" | "saida" | "despesa";
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  fornecedor?: string;
  idCompra?: string;
};

interface FinanceiroState {
  transacoes: Transacao[];
  saldo: number;

  adicionarTransacao: (t: Transacao) => void;
  calcularSaldo: () => void;
  limparTransacoes: () => void;

  registrarEntrada: (descricao: string, valor: number) => void;
  registrarSaida: (descricao: string, valor: number) => void;

  getEntradas: () => Transacao[];
  getSaidas: () => Transacao[];
  getRelatorio: () => { entradas: number; saidas: number; lucroLiquido: number };

  salvarFirebase: () => Promise<void>;
  carregarFirebase: () => Promise<void>;
}

export const useFinanceiroStore = create<FinanceiroState>()(
  persist(
    (set, get) => ({
      transacoes: [],
      saldo: 0,

      // 🔥 FUNÇÕES PASSIVAS - SEM ACOPLAMENTO
      adicionarTransacao: (t) => {
        set((state) => ({ transacoes: [...state.transacoes, t] }));
        get().calcularSaldo();
        // Removido: salvarFirebase() automático (agora controlado pelo service)
      },

      calcularSaldo: () => {
        const saldo = get().transacoes.reduce((acc, t) =>
          t.tipo === "entrada" ? acc + t.valor : acc - t.valor, 0);
        set({ saldo });
      },

      limparTransacoes: () => {
        set({ transacoes: [], saldo: 0 });
        get().salvarFirebase();
      },

      registrarEntrada: (descricao, valor) => {
        try {
          validarValor(valor);
          get().adicionarTransacao({
            id: crypto.randomUUID(),
            tipo: "entrada",
            descricao,
            valor,
            data: new Date().toISOString(),
          });
        } catch (error) {
          console.warn(error instanceof Error ? error.message : "Erro ao registrar entrada");
        }
      },

      registrarSaida: (descricao, valor) => {
        try {
          validarValor(valor);
          get().adicionarTransacao({
            id: crypto.randomUUID(),
            tipo: "saida",
            descricao,
            valor,
            data: new Date().toISOString(),
          });
        } catch (error) {
          console.warn(error instanceof Error ? error.message : "Erro ao registrar saída");
        }
      },

      getEntradas: () => get().transacoes.filter(t => t.tipo === "entrada"),
      getSaidas: () => get().transacoes.filter(t => t.tipo === "saida" || t.tipo === "despesa"),

      getRelatorio: () => {
        const entradas = get().getEntradas().reduce((a, t) => a + t.valor, 0);
        const saidas = get().getSaidas().reduce((a, t) => a + t.valor, 0);
        return { entradas, saidas, lucroLiquido: entradas - saidas };
      },

      salvarFirebase: async () => {
        const { transacoes, saldo } = get();
        await salvarSeguroFinanceiro({ transacoes, saldo });
      },

      carregarFirebase: async () => {
        const dados = await carregarDoFirebase("financeiro");
        if (dados) set(dados);
      },
    }),
    { name: "valeime-financeiro" }
  )
);
