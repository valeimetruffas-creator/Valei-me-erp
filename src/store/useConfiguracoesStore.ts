import { create } from "zustand";
import {
  ConfiguracaoPorModulo,
  ModuloConfiguracaoKey,
  ValorConfiguracaoModulo,
  obterDefinicaoModulo,
} from "../types/ConfiguracoesSistema";
import { carregarConfiguracaoModulo, salvarConfiguracaoModulo } from "../services/configuracaoService";
import { carregarIntegracao, salvarIntegracao } from "../services/integracaoService";

type CacheConfiguracoes = Partial<ConfiguracaoPorModulo>;

interface ConfiguracoesState {
  cache: CacheConfiguracoes;
  carregando: boolean;
  salvando: boolean;
  erro: string | null;
  carregarModulo: <K extends ModuloConfiguracaoKey>(
    chave: K,
    fallback: ValorConfiguracaoModulo<K>
  ) => Promise<ValorConfiguracaoModulo<K>>;
  salvarModulo: <K extends ModuloConfiguracaoKey>(
    chave: K,
    dados: ValorConfiguracaoModulo<K>,
    usuarioId?: string
  ) => Promise<void>;
  limparErro: () => void;
}

export const useConfiguracoesStore = create<ConfiguracoesState>((set, get) => ({
  cache: {},
  carregando: false,
  salvando: false,
  erro: null,

  carregarModulo: async <K extends ModuloConfiguracaoKey>(
    chave: K,
    fallback: ValorConfiguracaoModulo<K>
  ): Promise<ValorConfiguracaoModulo<K>> => {
    set({ carregando: true, erro: null });

    try {
      const definicao = obterDefinicaoModulo(chave);
      const remoto =
        definicao.colecao === "integracoes"
          ? await carregarIntegracao(chave)
          : await carregarConfiguracaoModulo(chave);

      const dados = remoto ?? fallback;

      set({
        cache: {
          ...get().cache,
          [chave]: dados,
        },
      });

      return dados as ValorConfiguracaoModulo<K>;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Falha ao carregar configuração";
      set({ erro: mensagem });
      return fallback;
    } finally {
      set({ carregando: false });
    }
  },

  salvarModulo: async <K extends ModuloConfiguracaoKey>(
    chave: K,
    dados: ValorConfiguracaoModulo<K>,
    usuarioId?: string
  ): Promise<void> => {
    set({ salvando: true, erro: null });

    try {
      const definicao = obterDefinicaoModulo(chave);

      if (definicao.colecao === "integracoes") {
        await salvarIntegracao(chave, dados, usuarioId);
      } else {
        await salvarConfiguracaoModulo(chave, dados, usuarioId);
      }

      set({
        cache: {
          ...get().cache,
          [chave]: dados,
        },
      });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Falha ao salvar configuração";
      set({ erro: mensagem });
      throw new Error(mensagem);
    } finally {
      set({ salvando: false });
    }
  },

  limparErro: () => set({ erro: null }),
}));
