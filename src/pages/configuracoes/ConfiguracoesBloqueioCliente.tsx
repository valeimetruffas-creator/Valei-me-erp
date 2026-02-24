import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputNumeroConfiguracao,
  TextareaConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoBloqueioCliente } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoBloqueioCliente = {
  ativo: true,
  bloquearInadimplentesAutomaticamente: true,
  diasParaBloqueio: 30,
  bloquearPorFraude: true,
  motivoPadraoBloqueio: "Cliente com histórico de inadimplência ou tentativa de fraude.",
};

export default function ConfiguracoesBloqueioCliente() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("bloqueioCliente", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Bloquear cliente"
      descricao="Políticas de risco para bloqueio automático ou manual de clientes."
      mensagem={mensagem}
      tipoFeedback={tipoFeedback}
      carregando={carregando}
      salvando={salvando}
      onSalvar={salvar}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoConfiguracao label="Política ativa">
          <ToggleConfiguracao checked={dados.ativo} onChange={(v) => atualizarCampo("ativo", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Bloqueio por inadimplência">
          <ToggleConfiguracao
            checked={dados.bloquearInadimplentesAutomaticamente}
            onChange={(v) => atualizarCampo("bloquearInadimplentesAutomaticamente", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Bloqueio por fraude">
          <ToggleConfiguracao checked={dados.bloquearPorFraude} onChange={(v) => atualizarCampo("bloquearPorFraude", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Dias para bloqueio automático">
          <InputNumeroConfiguracao value={dados.diasParaBloqueio} onChange={(v) => atualizarCampo("diasParaBloqueio", v)} min={1} />
        </CampoConfiguracao>
      </div>

      <CampoConfiguracao label="Motivo padrão de bloqueio">
        <TextareaConfiguracao value={dados.motivoPadraoBloqueio} onChange={(v) => atualizarCampo("motivoPadraoBloqueio", v)} rows={4} />
      </CampoConfiguracao>
    </PainelModuloConfiguracao>
  );
}
