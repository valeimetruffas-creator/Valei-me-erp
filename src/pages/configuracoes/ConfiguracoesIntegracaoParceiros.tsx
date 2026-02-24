import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  SelectConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoIntegracaoParceirosLogistica } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoIntegracaoParceirosLogistica = {
  ativo: false,
  integrar99Food: false,
  integrar99Entregas: false,
  integrarUberDirect: false,
  prioridadeRoteamento: "interno",
};

export default function ConfiguracoesIntegracaoParceiros() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("integracaoParceirosLogistica", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Integração 99Food / 99Entregas / Uber"
      descricao="Configuração de parceiros logísticos e roteamento inteligente de entregas."
      mensagem={mensagem}
      tipoFeedback={tipoFeedback}
      carregando={carregando}
      salvando={salvando}
      onSalvar={salvar}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoConfiguracao label="Módulo ativo">
          <ToggleConfiguracao checked={dados.ativo} onChange={(v) => atualizarCampo("ativo", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Integração 99Food">
          <ToggleConfiguracao checked={dados.integrar99Food} onChange={(v) => atualizarCampo("integrar99Food", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Integração 99Entregas">
          <ToggleConfiguracao checked={dados.integrar99Entregas} onChange={(v) => atualizarCampo("integrar99Entregas", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Integração Uber Direct">
          <ToggleConfiguracao checked={dados.integrarUberDirect} onChange={(v) => atualizarCampo("integrarUberDirect", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Prioridade de roteamento">
          <SelectConfiguracao
            value={dados.prioridadeRoteamento}
            onChange={(v) => atualizarCampo("prioridadeRoteamento", v)}
            options={[
              { label: "Frota interna", value: "interno" },
              { label: "99Entregas", value: "99entregas" },
              { label: "Uber Direct", value: "uberdirect" },
            ]}
          />
        </CampoConfiguracao>
      </div>
    </PainelModuloConfiguracao>
  );
}
