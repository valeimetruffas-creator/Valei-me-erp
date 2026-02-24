import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputNumeroConfiguracao,
  TextareaConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoMapaMesas } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoMapaMesas = {
  ativo: false,
  totalMesas: 20,
  setores: "Salão principal\nVaranda\nDelivery balcão",
  controleComandasAtivo: true,
  tempoLimiteOcupacaoMinutos: 90,
};

export default function ConfiguracoesMapaMesas() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("mapaMesas", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Mapa de mesas"
      descricao="Parametrize capacidade de salão e controle operacional de atendimento local."
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

        <CampoConfiguracao label="Controle de comandas ativo">
          <ToggleConfiguracao
            checked={dados.controleComandasAtivo}
            onChange={(v) => atualizarCampo("controleComandasAtivo", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Total de mesas">
          <InputNumeroConfiguracao value={dados.totalMesas} onChange={(v) => atualizarCampo("totalMesas", v)} min={1} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Tempo limite ocupação (min)">
          <InputNumeroConfiguracao
            value={dados.tempoLimiteOcupacaoMinutos}
            onChange={(v) => atualizarCampo("tempoLimiteOcupacaoMinutos", v)}
            min={10}
          />
        </CampoConfiguracao>
      </div>

      <CampoConfiguracao label="Setores (um por linha)">
        <TextareaConfiguracao value={dados.setores} onChange={(v) => atualizarCampo("setores", v)} rows={4} />
      </CampoConfiguracao>
    </PainelModuloConfiguracao>
  );
}
