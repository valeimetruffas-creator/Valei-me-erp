import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputNumeroConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoMotoboys } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoMotoboys = {
  ativo: true,
  taxaPadraoEntrega: 8,
  tempoMedioEntregaMinutos: 45,
  distanciaMaximaKm: 12,
  aceitaTerceirizados: true,
};

export default function ConfiguracoesMotoboys() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("motoboys", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Motoboys"
      descricao="Defina políticas operacionais de entrega para equipe própria e parceiros."
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

        <CampoConfiguracao label="Aceita motoboy terceirizado">
          <ToggleConfiguracao
            checked={dados.aceitaTerceirizados}
            onChange={(v) => atualizarCampo("aceitaTerceirizados", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Taxa padrão de entrega (R$)">
          <InputNumeroConfiguracao
            value={dados.taxaPadraoEntrega}
            onChange={(v) => atualizarCampo("taxaPadraoEntrega", v)}
            step={0.01}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Tempo médio de entrega (min)">
          <InputNumeroConfiguracao
            value={dados.tempoMedioEntregaMinutos}
            onChange={(v) => atualizarCampo("tempoMedioEntregaMinutos", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Distância máxima de entrega (km)">
          <InputNumeroConfiguracao
            value={dados.distanciaMaximaKm}
            onChange={(v) => atualizarCampo("distanciaMaximaKm", v)}
            step={0.5}
          />
        </CampoConfiguracao>
      </div>
    </PainelModuloConfiguracao>
  );
}
