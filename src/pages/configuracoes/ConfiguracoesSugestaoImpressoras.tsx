import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputTextoConfiguracao,
  SelectConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoSugestaoImpressoras } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoSugestaoImpressoras = {
  ativo: true,
  fabricantePreferencial: "Epson",
  larguraPapelMm: 80,
  conexaoPreferencial: "rede",
  habilitarDescobertaAutomatica: true,
};

export default function ConfiguracoesSugestaoImpressoras() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("sugestaoImpressoras", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Sugestão de impressoras"
      descricao="Recomendações de hardware e padrão de impressão para operação estável."
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

        <CampoConfiguracao label="Descoberta automática de impressoras">
          <ToggleConfiguracao
            checked={dados.habilitarDescobertaAutomatica}
            onChange={(v) => atualizarCampo("habilitarDescobertaAutomatica", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Fabricante preferencial">
          <InputTextoConfiguracao
            value={dados.fabricantePreferencial}
            onChange={(v) => atualizarCampo("fabricantePreferencial", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Largura papel (mm)">
          <SelectConfiguracao
            value={String(dados.larguraPapelMm) as "58" | "80"}
            onChange={(v) => atualizarCampo("larguraPapelMm", Number(v) as 58 | 80)}
            options={[
              { label: "58mm", value: "58" },
              { label: "80mm", value: "80" },
            ]}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Conexão preferencial">
          <SelectConfiguracao
            value={dados.conexaoPreferencial}
            onChange={(v) => atualizarCampo("conexaoPreferencial", v)}
            options={[
              { label: "USB", value: "usb" },
              { label: "Rede", value: "rede" },
              { label: "Bluetooth", value: "bluetooth" },
            ]}
          />
        </CampoConfiguracao>
      </div>
    </PainelModuloConfiguracao>
  );
}
