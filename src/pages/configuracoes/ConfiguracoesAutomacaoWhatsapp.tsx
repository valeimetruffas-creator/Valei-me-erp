import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputTextoConfiguracao,
  TextareaConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoAutomacaoWhatsapp } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoAutomacaoWhatsapp = {
  ativo: false,
  enviarConfirmacaoPedido: true,
  enviarAtualizacaoStatus: true,
  templateMensagemBoasVindas: "Olá! Seu pedido foi recebido e já está em preparação.",
  numeroRemetente: "",
};

export default function ConfiguracoesAutomacaoWhatsapp() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("automacaoWhatsapp", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Automação WhatsApp"
      descricao="Automatize notificações de pedido e relacionamento com clientes."
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

        <CampoConfiguracao label="Enviar confirmação automática">
          <ToggleConfiguracao
            checked={dados.enviarConfirmacaoPedido}
            onChange={(v) => atualizarCampo("enviarConfirmacaoPedido", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Enviar atualização de status">
          <ToggleConfiguracao
            checked={dados.enviarAtualizacaoStatus}
            onChange={(v) => atualizarCampo("enviarAtualizacaoStatus", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Número remetente">
          <InputTextoConfiguracao
            value={dados.numeroRemetente}
            onChange={(v) => atualizarCampo("numeroRemetente", v)}
            placeholder="Ex: 5511999999999"
          />
        </CampoConfiguracao>
      </div>

      <CampoConfiguracao label="Template de boas-vindas">
        <TextareaConfiguracao
          value={dados.templateMensagemBoasVindas}
          onChange={(v) => atualizarCampo("templateMensagemBoasVindas", v)}
          rows={4}
        />
      </CampoConfiguracao>
    </PainelModuloConfiguracao>
  );
}
