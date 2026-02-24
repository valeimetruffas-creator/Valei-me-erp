import { useEffect, useMemo, useState } from "react";
import { Link2, Search } from "lucide-react";
import { theme } from "../styles/theme";
import { observarProdutosNaoMapeados, vincularItemNaoMapeado } from "../services/mapeamentoProdutoService";
import { ProdutoNaoMapeado } from "../types/ProdutoNaoMapeado";
import { useConfeitariaStore } from "../store/useConfeitariaStore";

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tempoRelativo(iso?: string): string {
  if (!iso) return "Agora";
  const diferenca = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(diferenca) || diferenca < 1) return "Agora";
  if (diferenca < 60) return `${diferenca} min`;
  const horas = Math.floor(diferenca / 60);
  const minutos = diferenca % 60;
  return `${horas}h ${minutos}m`;
}

export default function ProdutosNaoMapeados() {
  const { produtos } = useConfeitariaStore();
  const [itensNaoMapeados, setItensNaoMapeados] = useState<ProdutoNaoMapeado[]>([]);
  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<Record<string, string>>({});
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<Record<string, boolean>>({});
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const unsubscribe = observarProdutosNaoMapeados((itens) => {
      setItensNaoMapeados(itens);
    });

    return () => unsubscribe();
  }, []);

  const itensFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);
    if (!termo) {
      return itensNaoMapeados;
    }

    return itensNaoMapeados.filter((item) => {
      const conteudo = normalizarTexto(`${item.nome} ${item.ifoodProductId || ""} ${item.externalCode || ""} ${item.pedidoId}`);
      return conteudo.includes(termo);
    });
  }, [busca, itensNaoMapeados]);

  const produtosAtivos = useMemo(() => {
    return produtos
      .filter((produto) => produto.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos]);

  async function handleVincular(naoMapeadoId: string) {
    const produtoId = produtoSelecionado[naoMapeadoId];
    if (!produtoId) {
      setMensagem("Selecione um produto interno para vincular.");
      return;
    }

    setMensagem("");
    setAcaoEmAndamento((estado) => ({ ...estado, [naoMapeadoId]: true }));

    try {
      await vincularItemNaoMapeado(naoMapeadoId, produtoId);
      setMensagem("Vínculo salvo com sucesso.");
      setProdutoSelecionado((estado) => {
        const novo = { ...estado };
        delete novo[naoMapeadoId];
        return novo;
      });
    } catch (error) {
      const texto = error instanceof Error ? error.message : "Falha ao vincular produto";
      setMensagem(texto);
    } finally {
      setAcaoEmAndamento((estado) => ({ ...estado, [naoMapeadoId]: false }));
    }
  }

  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
          🔗 Produtos não mapeados
        </h1>
        <p style={{ color: theme.colors.background }}>
          Itens recebidos do iFood sem vínculo com catálogo interno.
        </p>
      </div>

      <div className="relative mb-6 max-w-xl">
        <Search size={18} style={{ position: "absolute", left: 12, top: 13, color: theme.colors.border }} />
        <input
          type="text"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por item, pedido, ID iFood ou externalCode"
          className="w-full pl-10 pr-4 py-3 rounded-lg"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.primary,
            border: `1px solid ${theme.colors.border}`,
          }}
        />
      </div>

      {mensagem && (
        <div className="mb-4 rounded-lg p-3 text-sm font-medium" style={{ backgroundColor: theme.colors.background, color: theme.colors.primary }}>
          {mensagem}
        </div>
      )}

      {itensFiltrados.length === 0 ? (
        <div className="rounded-xl p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.primary }}>
          Nenhum item pendente de mapeamento.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {itensFiltrados.map((item) => (
            <div key={item.id} className="rounded-xl p-5 shadow-lg" style={{ backgroundColor: theme.colors.background }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                  {item.nome}
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: theme.colors.surfaceAlt, color: theme.colors.warning }}
                >
                  Pendente
                </span>
              </div>

              <div className="space-y-1 text-sm" style={{ color: theme.colors.textSecondary }}>
                <p><strong>Pedido:</strong> {item.pedidoId}</p>
                <p><strong>Quantidade:</strong> {item.quantidade}</p>
                <p><strong>Valor unitário:</strong> R$ {item.precoUnitario.toFixed(2)}</p>
                <p><strong>iFood Product ID:</strong> {item.ifoodProductId || "-"}</p>
                <p><strong>External Code:</strong> {item.externalCode || "-"}</p>
                <p><strong>Recebido há:</strong> {tempoRelativo(item.recebidoEm)}</p>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <select
                  value={produtoSelecionado[item.id] || ""}
                  onChange={(event) =>
                    setProdutoSelecionado((estado) => ({
                      ...estado,
                      [item.id]: event.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border"
                  style={{ borderColor: theme.colors.border, color: theme.colors.primary }}
                >
                  <option value="">Selecione um produto interno</option>
                  {produtosAtivos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={Boolean(acaoEmAndamento[item.id])}
                  onClick={() => {
                    void handleVincular(item.id);
                  }}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: theme.colors.success, color: theme.colors.background }}
                >
                  <Link2 size={16} /> Vincular
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
