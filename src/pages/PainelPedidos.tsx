import { useEffect, useMemo, useState } from "react";
import { Timestamp, collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { theme } from "../styles/theme";
import { Pedido, StatusPedido } from "../types/Pedido";
import { atualizarStatusPedido } from "../services/backendService";

const ORDEM_STATUS: Record<StatusPedido, number> = {
  pendente: 1,
  aceito: 2,
  preparando: 3,
  saiu_entrega: 4,
  entregue: 5,
  cancelado: 6,
};

const LABEL_STATUS: Record<StatusPedido, string> = {
  pendente: "Pendente",
  aceito: "Aceito",
  preparando: "Preparando",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const COR_STATUS: Record<StatusPedido, { fundo: keyof typeof theme.colors; texto: keyof typeof theme.colors }> = {
  pendente: { fundo: "surfaceAlt", texto: "warning" },
  aceito: { fundo: "surfaceAlt", texto: "info" },
  preparando: { fundo: "surfaceAlt", texto: "primaryDark" },
  saiu_entrega: { fundo: "surfaceAlt", texto: "textSecondary" },
  entregue: { fundo: "surfaceAlt", texto: "success" },
  cancelado: { fundo: "surfaceAlt", texto: "danger" },
};

function asStatus(value: unknown): StatusPedido {
  const status = String(value ?? "").trim().toLowerCase();
  if (
    status === "pendente" ||
    status === "aceito" ||
    status === "preparando" ||
    status === "saiu_entrega" ||
    status === "entregue" ||
    status === "cancelado"
  ) {
    return status;
  }
  return "pendente";
}

function asIso(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "object" && value !== null) {
    const registro = value as { seconds?: number };
    if (typeof registro.seconds === "number") {
      return new Date(registro.seconds * 1000).toISOString();
    }
  }
  return undefined;
}

function tempoRelativo(iso?: string): string {
  if (!iso) return "Agora";

  const data = new Date(iso).getTime();
  if (Number.isNaN(data)) return "Agora";

  const diffMinutos = Math.floor((Date.now() - data) / 60000);
  if (diffMinutos < 1) return "Agora";
  if (diffMinutos < 60) return `${diffMinutos} min`;

  const horas = Math.floor(diffMinutos / 60);
  const minutos = diffMinutos % 60;
  return `${horas}h ${minutos}m`;
}

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusPedido>("todos");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string>("");

  useEffect(() => {
    const referencia = collection(db, "pedidos");

    const unsubscribe = onSnapshot(referencia, (snapshot) => {
      const lista: Pedido[] = snapshot.docs.map((docSnap) => {
        const dados = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          cliente: String(dados.cliente ?? "Cliente"),
          itens: Array.isArray(dados.itens)
            ? dados.itens.map((item) => {
                const registro = (item ?? {}) as Record<string, unknown>;
                return {
                  id: String(registro.id ?? ""),
                  nome: String(registro.nome ?? "Item"),
                  quantidade: Number(registro.quantidade ?? 0),
                  precoUnitario: Number(registro.precoUnitario ?? 0),
                };
              })
            : [],
          valor: Number(dados.valor ?? dados.total ?? 0),
          status: asStatus(dados.status),
          origem: String(dados.origem ?? "ifood") === "delivery" ? "delivery" : "ifood",
          atualizadoEm: asIso(dados.atualizadoEm),
          recebidoEm: asIso(dados.recebidoEm),
          estoqueBaixado: Boolean(dados.estoqueBaixado),
        };
      });

      setPedidos(lista);
    });

    return () => unsubscribe();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const filtrados = filtroStatus === "todos" ? pedidos : pedidos.filter((pedido) => pedido.status === filtroStatus);
    return [...filtrados].sort((a, b) => {
      const statusDiff = ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status];
      if (statusDiff !== 0) return statusDiff;
      const dataA = new Date(a.atualizadoEm ?? a.recebidoEm ?? 0).getTime();
      const dataB = new Date(b.atualizadoEm ?? b.recebidoEm ?? 0).getTime();
      return dataA - dataB;
    });
  }, [filtroStatus, pedidos]);

  async function executarAcao(pedidoId: string, acao: "aceitar" | "rejeitar" | "preparando" | "saiu_entrega" | "entregue") {
    setMensagem("");
    setAcaoEmAndamento((estadoAtual) => ({ ...estadoAtual, [pedidoId]: acao }));

    try {
      const status = acao === "aceitar" ? "aceito" : acao === "rejeitar" ? "cancelado" : acao;
      await atualizarStatusPedido({ pedidoId, status });
      setMensagem("Pedido atualizado com sucesso.");
    } catch (error) {
      const texto = error instanceof Error ? error.message : "Falha ao atualizar pedido";
      setMensagem(texto);
    } finally {
      setAcaoEmAndamento((estadoAtual) => {
        const novoEstado = { ...estadoAtual };
        delete novoEstado[pedidoId];
        return novoEstado;
      });
    }
  }

  function renderizarAcoes(pedido: Pedido) {
    const executando = Boolean(acaoEmAndamento[pedido.id]);
    const botaoBase = "px-3 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50";

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {pedido.status === "pendente" && (
          <>
            <button
              disabled={executando}
              onClick={() => executarAcao(pedido.id, "aceitar")}
              className={botaoBase}
              style={{ backgroundColor: theme.colors.success, color: theme.colors.background }}
            >
              Aceitar
            </button>
            <button
              disabled={executando}
              onClick={() => executarAcao(pedido.id, "rejeitar")}
              className={botaoBase}
              style={{ backgroundColor: theme.colors.danger, color: theme.colors.background }}
            >
              Rejeitar
            </button>
          </>
        )}

        {pedido.status === "aceito" && (
          <>
            <button
              disabled={executando}
              onClick={() => executarAcao(pedido.id, "preparando")}
              className={botaoBase}
              style={{ backgroundColor: theme.colors.warning, color: theme.colors.background }}
            >
              Preparar
            </button>
            <button
              disabled={executando}
              onClick={() => executarAcao(pedido.id, "rejeitar")}
              className={botaoBase}
              style={{ backgroundColor: theme.colors.danger, color: theme.colors.background }}
            >
              Rejeitar
            </button>
          </>
        )}

        {pedido.status === "preparando" && (
          <button
            disabled={executando}
            onClick={() => executarAcao(pedido.id, "saiu_entrega")}
            className={botaoBase}
            style={{ backgroundColor: theme.colors.info, color: theme.colors.background }}
          >
            Saiu
          </button>
        )}

        {pedido.status === "saiu_entrega" && (
          <button
            disabled={executando}
            onClick={() => executarAcao(pedido.id, "entregue")}
            className={botaoBase}
            style={{ backgroundColor: theme.colors.success, color: theme.colors.background }}
          >
            Entregue
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
          🧾 Painel de Pedidos
        </h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" style={{ color: theme.colors.background }}>
            Filtro:
          </label>
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value as "todos" | StatusPedido)}
            className="px-3 py-2 rounded-lg border"
            style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.primary }}
          >
            <option value="todos">Todos</option>
            {Object.keys(LABEL_STATUS).map((status) => (
              <option key={status} value={status}>
                {LABEL_STATUS[status as StatusPedido]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-6" style={{ color: theme.colors.background }}>
        Pedidos em tempo real (iFood + Delivery), com controle operacional completo sem recarregar a tela.
      </p>

      {mensagem && (
        <div className="mb-4 rounded-lg p-3 text-sm font-medium" style={{ backgroundColor: theme.colors.background, color: theme.colors.primary }}>
          {mensagem}
        </div>
      )}

      {pedidosFiltrados.length === 0 ? (
        <div className="rounded-xl p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.primary }}>
          Nenhum pedido recebido.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="rounded-xl p-5 shadow-lg" style={{ backgroundColor: theme.colors.background }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                  Pedido #{pedido.id}
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: theme.colors[COR_STATUS[pedido.status].fundo],
                    color: theme.colors[COR_STATUS[pedido.status].texto],
                  }}
                >
                  {LABEL_STATUS[pedido.status]}
                </span>
              </div>

              <p style={{ color: theme.colors.border }}>
                <strong>Cliente:</strong> {pedido.cliente}
              </p>
              <p style={{ color: theme.colors.border }}>
                <strong>Origem:</strong> {pedido.origem}
              </p>
              <p style={{ color: theme.colors.border }}>
                <strong>Valor:</strong> R$ {pedido.valor.toFixed(2)}
              </p>
              <p style={{ color: theme.colors.border }}>
                <strong>Tempo do pedido:</strong> {tempoRelativo(pedido.recebidoEm ?? pedido.atualizadoEm)}
              </p>

              <div className="mt-3">
                <p className="font-semibold mb-1" style={{ color: theme.colors.primary }}>Itens:</p>
                <ul className="space-y-1">
                  {pedido.itens.map((item) => (
                    <li key={item.id} className="text-sm" style={{ color: theme.colors.border }}>
                      {item.nome} • {item.quantidade}x • R$ {item.precoUnitario.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              {renderizarAcoes(pedido)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
