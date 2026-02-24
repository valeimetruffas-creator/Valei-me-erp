import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputTextoConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoIntegracaoApiAberta } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoIntegracaoApiAberta = {
  ativo: false,
  apiPublicaAtiva: false,
  urlBaseApi: "https://api.seusistema.com/v1",
  exigirAssinaturaWebhook: true,
  versaoApi: "v1",
};

export default function ConfiguracoesIntegracoesApiAberta() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("integracoesApiAberta", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Integrações / API aberta"
      descricao="Parâmetros para API pública, webhooks e expansão de ecossistema."
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

        <CampoConfiguracao label="API pública ativa">
          <ToggleConfiguracao checked={dados.apiPublicaAtiva} onChange={(v) => atualizarCampo("apiPublicaAtiva", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Exigir assinatura de webhook">
          <ToggleConfiguracao
            checked={dados.exigirAssinaturaWebhook}
            onChange={(v) => atualizarCampo("exigirAssinaturaWebhook", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Versão da API">
          <InputTextoConfiguracao value={dados.versaoApi} onChange={(v) => atualizarCampo("versaoApi", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="URL base da API">
          <InputTextoConfiguracao value={dados.urlBaseApi} onChange={(v) => atualizarCampo("urlBaseApi", v)} type="url" />
        </CampoConfiguracao>
      </div>
    </PainelModuloConfiguracao>
  );
}
