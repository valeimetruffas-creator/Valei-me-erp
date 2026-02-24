import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputNumeroConfiguracao,
  TextareaConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoCidadesEntrega } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoCidadesEntrega = {
  ativo: true,
  cidadesAtendidas: "São Paulo\nGuarulhos\nSanto André",
  raioPadraoKm: 10,
  valorMinimoPedido: 20,
  taxaEntregaBase: 7,
};

export default function ConfiguracoesCidadesEntrega() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("cidadesEntrega", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Configuração de cidades"
      descricao="Defina área de atendimento, taxa e regras mínimas para entrega."
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

        <CampoConfiguracao label="Raio padrão (km)">
          <InputNumeroConfiguracao value={dados.raioPadraoKm} onChange={(v) => atualizarCampo("raioPadraoKm", v)} step={0.5} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Valor mínimo pedido (R$)">
          <InputNumeroConfiguracao
            value={dados.valorMinimoPedido}
            onChange={(v) => atualizarCampo("valorMinimoPedido", v)}
            step={0.01}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Taxa base de entrega (R$)">
          <InputNumeroConfiguracao
            value={dados.taxaEntregaBase}
            onChange={(v) => atualizarCampo("taxaEntregaBase", v)}
            step={0.01}
          />
        </CampoConfiguracao>
      </div>

      <CampoConfiguracao label="Cidades atendidas (uma por linha)">
        <TextareaConfiguracao value={dados.cidadesAtendidas} onChange={(v) => atualizarCampo("cidadesAtendidas", v)} rows={5} />
      </CampoConfiguracao>
    </PainelModuloConfiguracao>
  );
}
