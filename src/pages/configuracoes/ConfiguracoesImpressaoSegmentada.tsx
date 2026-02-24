import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputNumeroConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoImpressaoSegmentada } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoImpressaoSegmentada = {
  ativo: true,
  imprimirCozinha: true,
  imprimirBar: false,
  imprimirCaixa: true,
  copiasPadrao: 1,
};

export default function ConfiguracoesImpressaoSegmentada() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("impressaoSegmentada", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Impressão segmentada"
      descricao="Defina filas de impressão por setor operacional da loja."
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

        <CampoConfiguracao label="Impressão cozinha">
          <ToggleConfiguracao checked={dados.imprimirCozinha} onChange={(v) => atualizarCampo("imprimirCozinha", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Impressão bar">
          <ToggleConfiguracao checked={dados.imprimirBar} onChange={(v) => atualizarCampo("imprimirBar", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Impressão caixa">
          <ToggleConfiguracao checked={dados.imprimirCaixa} onChange={(v) => atualizarCampo("imprimirCaixa", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Cópias padrão">
          <InputNumeroConfiguracao value={dados.copiasPadrao} onChange={(v) => atualizarCampo("copiasPadrao", v)} min={1} />
        </CampoConfiguracao>
      </div>
    </PainelModuloConfiguracao>
  );
}
