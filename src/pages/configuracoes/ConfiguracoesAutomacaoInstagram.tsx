import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputTextoConfiguracao,
  TextareaConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoAutomacaoInstagram } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoAutomacaoInstagram = {
  ativo: false,
  responderComentariosAutomaticamente: false,
  responderDirectAutomaticamente: true,
  mensagemRespostaPadrao: "Olá! Nossa equipe recebeu sua mensagem e responderá em breve.",
  horarioAtendimento: "09:00-22:00",
};

export default function ConfiguracoesAutomacaoInstagram() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("automacaoInstagram", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Automação Instagram"
      descricao="Padronize atendimento automático em comentários e direct."
      mensagem={mensagem}
      tipoFeedback={tipoFeedback}
      carregando={carregando}
      salvando={salvando}
      onSalvar={salvar}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoConfiguracao label="Automação ativa">
          <ToggleConfiguracao checked={dados.ativo} onChange={(v) => atualizarCampo("ativo", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Responder comentários automaticamente">
          <ToggleConfiguracao
            checked={dados.responderComentariosAutomaticamente}
            onChange={(v) => atualizarCampo("responderComentariosAutomaticamente", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Responder direct automaticamente">
          <ToggleConfiguracao
            checked={dados.responderDirectAutomaticamente}
            onChange={(v) => atualizarCampo("responderDirectAutomaticamente", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Horário de atendimento">
          <InputTextoConfiguracao value={dados.horarioAtendimento} onChange={(v) => atualizarCampo("horarioAtendimento", v)} />
        </CampoConfiguracao>
      </div>

      <CampoConfiguracao label="Mensagem padrão">
        <TextareaConfiguracao value={dados.mensagemRespostaPadrao} onChange={(v) => atualizarCampo("mensagemRespostaPadrao", v)} rows={4} />
      </CampoConfiguracao>
    </PainelModuloConfiguracao>
  );
}
