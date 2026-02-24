import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import {
  CampoConfiguracao,
  InputNumeroConfiguracao,
  InputTextoConfiguracao,
  SelectConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoEmissaoNotaFiscal } from "../../types/ConfiguracoesSistema";

const FALLBACK: ConfiguracaoEmissaoNotaFiscal = {
  ativo: false,
  ambiente: "homologacao",
  serieNfce: "1",
  proximoNumero: 1,
  cscTokenId: "",
  cscCodigo: "",
};

export default function ConfiguracoesEmissaoNotaFiscal() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("emissaoNotaFiscal", FALLBACK);

  return (
    <PainelModuloConfiguracao
      titulo="Emissão de nota fiscal"
      descricao="Parâmetros fiscais de emissão NFC-e para operação comercial."
      mensagem={mensagem}
      tipoFeedback={tipoFeedback}
      carregando={carregando}
      salvando={salvando}
      onSalvar={salvar}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoConfiguracao label="Emissão ativa">
          <ToggleConfiguracao checked={dados.ativo} onChange={(v) => atualizarCampo("ativo", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Ambiente">
          <SelectConfiguracao
            value={dados.ambiente}
            onChange={(v) => atualizarCampo("ambiente", v)}
            options={[
              { label: "Homologação", value: "homologacao" },
              { label: "Produção", value: "producao" },
            ]}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Série NFC-e">
          <InputTextoConfiguracao value={dados.serieNfce} onChange={(v) => atualizarCampo("serieNfce", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Próximo número">
          <InputNumeroConfiguracao
            value={dados.proximoNumero}
            onChange={(v) => atualizarCampo("proximoNumero", v)}
            min={1}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="CSC Token ID">
          <InputTextoConfiguracao value={dados.cscTokenId} onChange={(v) => atualizarCampo("cscTokenId", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="CSC Código">
          <InputTextoConfiguracao
            value={dados.cscCodigo}
            onChange={(v) => atualizarCampo("cscCodigo", v)}
            type="password"
          />
        </CampoConfiguracao>
      </div>
    </PainelModuloConfiguracao>
  );
}
