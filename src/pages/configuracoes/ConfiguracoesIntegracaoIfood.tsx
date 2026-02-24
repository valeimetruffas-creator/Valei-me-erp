import PainelModuloConfiguracao from "../../components/configuracoes/PainelModuloConfiguracao";
import { useState } from "react";
import {
  CampoConfiguracao,
  InputTextoConfiguracao,
  ToggleConfiguracao,
} from "../../components/configuracoes/CamposConfiguracao";
import { useModuloConfiguracao } from "../../hooks/useModuloConfiguracao";
import { ConfiguracaoIntegracaoIfood } from "../../types/ConfiguracoesSistema";
import { migrarMapeamentoProdutosIfood, sincronizarProdutosIfood } from "../../services/backendService";
import { theme } from "../../styles/theme";
import { conectarIfood, dashboardIfood, desconectarIfood, statusIfood, syncCatalogoIfood } from "../../services/ifoodApi";

const FALLBACK: ConfiguracaoIntegracaoIfood = {
  ativo: false,
  merchantId: "",
  clientId: "",
  webhookUrl: "https://api.seusistema.com/webhooks/ifood",
  sincronizarCardapioAutomatico: true,
  sincronizarEstoqueAutomatico: true,
};

export default function ConfiguracoesIntegracaoIfood() {
  const { dados, atualizarCampo, carregando, salvando, mensagem, tipoFeedback, salvar } =
    useModuloConfiguracao("integracaoIfood", FALLBACK);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensagemSync, setMensagemSync] = useState("");
  const [statusConexao, setStatusConexao] = useState<any>(null);
  const [dashboard, setDashboard] = useState<{
    pedidosRecebidos: number;
    pedidosProcessados: number;
    erros: number;
    tempoMedioMs: number;
    duplicidadesEvitadas: number;
    totalLogs: number;
  } | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [conectando, setConectando] = useState(false);
  const [migrando, setMigrando] = useState(false);
  const [incluirPendentes, setIncluirPendentes] = useState(true);
  const [limiteMigracao, setLimiteMigracao] = useState(1000);
  const [relatorioMigracao, setRelatorioMigracao] = useState<{
    total: number;
    atualizados: number;
    ignorados: number;
    erros: number;
    logs: string[];
  } | null>(null);

  async function handleSincronizarProdutos() {
    try {
      setSincronizando(true);
      setMensagemSync("");
      const resposta = await sincronizarProdutosIfood({});
      const dadosResposta = resposta.data as {
        totalLidos: number;
        totalSincronizados: number;
        totalIgnorados: number;
      };

      setMensagemSync(
        `Sincronização concluída: ${dadosResposta.totalSincronizados}/${dadosResposta.totalLidos} produtos enviados (${dadosResposta.totalIgnorados} ignorados).`
      );
    } catch (erro) {
      const mensagemErro = erro instanceof Error ? erro.message : "Falha ao sincronizar com iFood";
      setMensagemSync(mensagemErro);
    } finally {
      setSincronizando(false);
    }
  }

  async function handleConsultarStatus() {
    try {
      const [status, painel] = await Promise.all([statusIfood(), dashboardIfood()]);
      setStatusConexao(status);
      setDashboard(painel);
      setMensagemSync("Status iFood atualizado.");
    } catch (error) {
      setMensagemSync(error instanceof Error ? error.message : "Falha ao consultar status iFood");
    }
  }

  async function handleConectarIfood() {
    try {
      setConectando(true);
      setMensagemSync("");
      const data = await conectarIfood({
        clientId: dados.clientId,
        clientSecret,
        merchantId: dados.merchantId || undefined,
        ativo: dados.ativo,
      });

      setStatusConexao(data);
      setMensagemSync("Conexão iFood realizada com sucesso.");
      setClientSecret("");
    } catch (error) {
      setMensagemSync(error instanceof Error ? error.message : "Falha ao conectar iFood");
    } finally {
      setConectando(false);
    }
  }

  async function handleSyncCatalogoApi() {
    try {
      setSincronizando(true);
      const data = await syncCatalogoIfood({ merchantId: dados.merchantId || undefined });
      setMensagemSync(`Catálogo sincronizado via API iFood. Total de produtos: ${data.totalProdutos}.`);
      await handleConsultarStatus();
    } catch (error) {
      setMensagemSync(error instanceof Error ? error.message : "Falha na sincronização de catálogo");
    } finally {
      setSincronizando(false);
    }
  }

  async function handleDesconectarIfood() {
    try {
      await desconectarIfood();
      setStatusConexao(null);
      setMensagemSync("Integração iFood desconectada.");
    } catch (error) {
      setMensagemSync(error instanceof Error ? error.message : "Falha ao desconectar iFood");
    }
  }

  async function handleMigracao(apply: boolean) {
    try {
      setMigrando(true);
      setMensagemSync("");
      setRelatorioMigracao(null);

      const resposta = await migrarMapeamentoProdutosIfood({
        apply,
        incluirPendentes,
        limite: limiteMigracao,
      });

      const dadosResposta = resposta.data as {
        total: number;
        atualizados: number;
        ignorados: number;
        erros: number;
        logs: string[];
      };

      setRelatorioMigracao(dadosResposta);
      setMensagemSync(
        apply
          ? "Migração aplicada com sucesso no backend."
          : "Teste de migração (dry-run) concluído com sucesso."
      );
    } catch (erro) {
      const mensagemErro = erro instanceof Error ? erro.message : "Falha ao executar migração";
      setMensagemSync(mensagemErro);
    } finally {
      setMigrando(false);
    }
  }

  return (
    <PainelModuloConfiguracao
      titulo="Integração iFood"
      descricao="Conexão com iFood para sincronizar cardápio, estoque e pedidos."
      mensagem={mensagem}
      tipoFeedback={tipoFeedback}
      carregando={carregando}
      salvando={salvando}
      onSalvar={salvar}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoConfiguracao label="Integração ativa">
          <ToggleConfiguracao checked={dados.ativo} onChange={(v) => atualizarCampo("ativo", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Sincronizar cardápio automaticamente">
          <ToggleConfiguracao
            checked={dados.sincronizarCardapioAutomatico}
            onChange={(v) => atualizarCampo("sincronizarCardapioAutomatico", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Sincronizar estoque automaticamente">
          <ToggleConfiguracao
            checked={dados.sincronizarEstoqueAutomatico}
            onChange={(v) => atualizarCampo("sincronizarEstoqueAutomatico", v)}
          />
        </CampoConfiguracao>

        <CampoConfiguracao label="Merchant ID">
          <InputTextoConfiguracao value={dados.merchantId} onChange={(v) => atualizarCampo("merchantId", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Client ID">
          <InputTextoConfiguracao value={dados.clientId} onChange={(v) => atualizarCampo("clientId", v)} />
        </CampoConfiguracao>

        <CampoConfiguracao label="Client Secret">
          <InputTextoConfiguracao value={clientSecret} onChange={setClientSecret} type="password" />
        </CampoConfiguracao>

        <CampoConfiguracao label="Webhook URL">
          <InputTextoConfiguracao
            value={dados.webhookUrl}
            onChange={(v) => atualizarCampo("webhookUrl", v)}
            type="url"
          />
        </CampoConfiguracao>
      </div>

      <div className="mt-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleConectarIfood}
            disabled={conectando || carregando || !dados.clientId || !clientSecret}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.colors.info, color: "white" }}
          >
            {conectando ? "Conectando..." : "Conectar iFood"}
          </button>

          <button
            type="button"
            onClick={handleConsultarStatus}
            disabled={carregando}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.colors.primary, color: "white" }}
          >
            Consultar status
          </button>

          <button
            type="button"
            onClick={handleSyncCatalogoApi}
            disabled={sincronizando || carregando}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.colors.success, color: "white" }}
          >
            {sincronizando ? "Sincronizando..." : "Sincronizar catálogo (API)"}
          </button>

          <button
            type="button"
            onClick={handleDesconectarIfood}
            disabled={carregando}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.colors.warning, color: "white" }}
          >
            Desconectar
          </button>

          <button
            type="button"
            onClick={handleSincronizarProdutos}
            disabled={sincronizando || carregando}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.colors.success, color: "white" }}
          >
            {sincronizando ? "Sincronizando..." : "Sincronizar com iFood (Cloud Function)"}
          </button>
        </div>
      </div>

      {statusConexao && (
        <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: theme.colors.border, color: theme.colors.primary }}>
          <div><strong>Conectado:</strong> {statusConexao.conectado ? "Sim" : "Não"}</div>
          <div><strong>Ativo:</strong> {statusConexao.ativo ? "Sim" : "Não"}</div>
          <div><strong>Merchant atual:</strong> {statusConexao.merchantId || "-"}</div>
          <div><strong>Última sincronização:</strong> {statusConexao.ultimaSincronizacao || "-"}</div>
          <div><strong>Expiração do token:</strong> {statusConexao.tokenExpiration || "-"}</div>
        </div>
      )}

      {dashboard && (
        <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: theme.colors.border }}>
          <h4 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>Dashboard Integração iFood</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm" style={{ color: theme.colors.primary }}>
            <div><strong>Pedidos recebidos:</strong> {dashboard.pedidosRecebidos}</div>
            <div><strong>Pedidos processados:</strong> {dashboard.pedidosProcessados}</div>
            <div><strong>Erros:</strong> {dashboard.erros}</div>
            <div><strong>Tempo médio:</strong> {dashboard.tempoMedioMs} ms</div>
            <div><strong>Duplicidades evitadas:</strong> {dashboard.duplicidadesEvitadas}</div>
            <div><strong>Total de logs:</strong> {dashboard.totalLogs}</div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: theme.colors.border }}>
        <h3 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>
          Migração de mapeamento iFood (backend)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <CampoConfiguracao label="Incluir pendentes (casamento por nome)">
            <ToggleConfiguracao checked={incluirPendentes} onChange={setIncluirPendentes} />
          </CampoConfiguracao>

          <CampoConfiguracao label="Limite de registros">
            <InputTextoConfiguracao
              value={String(limiteMigracao)}
              onChange={(valor) => {
                const numero = Number(valor);
                setLimiteMigracao(Number.isFinite(numero) && numero > 0 ? numero : 1000);
              }}
              type="text"
            />
          </CampoConfiguracao>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void handleMigracao(false);
            }}
            disabled={migrando || carregando}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.colors.info, color: "white" }}
          >
            {migrando ? "Executando..." : "Testar migração (dry-run)"}
          </button>

          <button
            type="button"
            onClick={() => {
              void handleMigracao(true);
            }}
            disabled={migrando || carregando}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.colors.warning, color: "white" }}
          >
            {migrando ? "Executando..." : "Aplicar migração"}
          </button>
        </div>
      </div>

      {mensagemSync && (
        <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: theme.colors.border, color: theme.colors.primary }}>
          {mensagemSync}
        </div>
      )}

      {relatorioMigracao && (
        <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: theme.colors.border }}>
          <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>
            Resultado da migração
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm" style={{ color: theme.colors.primary }}>
            <div><strong>Total:</strong> {relatorioMigracao.total}</div>
            <div><strong>Atualizados:</strong> {relatorioMigracao.atualizados}</div>
            <div><strong>Ignorados:</strong> {relatorioMigracao.ignorados}</div>
            <div><strong>Erros:</strong> {relatorioMigracao.erros}</div>
          </div>

          {relatorioMigracao.logs.length > 0 && (
            <div className="mt-3 max-h-56 overflow-auto text-xs p-2 rounded" style={{ backgroundColor: theme.colors.surfaceAlt, color: theme.colors.textSecondary }}>
              {relatorioMigracao.logs.slice(0, 200).map((log, idx) => (
                <div key={`${idx}-${log}`}>{log}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </PainelModuloConfiguracao>
  );
}
