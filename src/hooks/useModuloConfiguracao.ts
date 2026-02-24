import { useEffect, useMemo, useState } from "react";
import {
  ModuloConfiguracaoKey,
  ValorConfiguracaoModulo,
} from "../types/ConfiguracoesSistema";
import { useConfiguracoesStore } from "../store/useConfiguracoesStore";
import { useAuth } from "../contexts/AuthContext";

type TipoFeedback = "sucesso" | "erro" | "neutro";

interface RetornoUseModuloConfiguracao<K extends ModuloConfiguracaoKey> {
  dados: ValorConfiguracaoModulo<K>;
  setDados: (proximo: ValorConfiguracaoModulo<K>) => void;
  atualizarCampo: <T extends keyof ValorConfiguracaoModulo<K>>(
    campo: T,
    valor: ValorConfiguracaoModulo<K>[T]
  ) => void;
  carregando: boolean;
  salvando: boolean;
  mensagem: string;
  tipoFeedback: TipoFeedback;
  salvar: () => Promise<void>;
}

export function useModuloConfiguracao<K extends ModuloConfiguracaoKey>(
  chave: K,
  fallback: ValorConfiguracaoModulo<K>
): RetornoUseModuloConfiguracao<K> {
  const { user } = useAuth();
  const { carregarModulo, salvarModulo, carregando, salvando } = useConfiguracoesStore();

  const [dados, setDados] = useState<ValorConfiguracaoModulo<K>>(fallback);
  const [mensagem, setMensagem] = useState<string>("");
  const [tipoFeedback, setTipoFeedback] = useState<TipoFeedback>("neutro");

  useEffect(() => {
    let ativo = true;

    carregarModulo(chave, fallback).then((dadosCarregados) => {
      if (ativo) {
        setDados(dadosCarregados);
      }
    });

    return () => {
      ativo = false;
    };
  }, [carregarModulo, chave, fallback]);

  const atualizarCampo = <T extends keyof ValorConfiguracaoModulo<K>>(
    campo: T,
    valor: ValorConfiguracaoModulo<K>[T]
  ): void => {
    setDados((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const salvar = async (): Promise<void> => {
    try {
      setMensagem("");
      await salvarModulo(chave, dados, user?.uid);
      setTipoFeedback("sucesso");
      setMensagem("Configuração salva com sucesso.");
    } catch (erro) {
      const textoErro = erro instanceof Error ? erro.message : "Falha ao salvar configuração";
      setTipoFeedback("erro");
      setMensagem(textoErro);
    }
  };

  return useMemo(
    () => ({
      dados,
      setDados,
      atualizarCampo,
      carregando,
      salvando,
      mensagem,
      tipoFeedback,
      salvar,
    }),
    [dados, carregando, mensagem, salvando, tipoFeedback]
  );
}
