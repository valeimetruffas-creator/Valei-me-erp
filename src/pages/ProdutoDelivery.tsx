import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { obterProdutoDelivery } from "../services/deliveryClienteService";
import { ProdutoCardapio } from "../types/DeliveryCliente";
import { useDeliveryClienteStore } from "../store/useDeliveryClienteStore";
import { theme } from "../styles/theme";

export default function ProdutoDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const adicionarItem = useDeliveryClienteStore((state) => state.adicionarItem);

  const [produto, setProduto] = useState<ProdutoCardapio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!id) {
      setCarregando(false);
      return;
    }

    void (async () => {
      const resposta = await obterProdutoDelivery(id);
      setProduto(resposta);
      setCarregando(false);
    })();
  }, [id]);

  function handleAdicionarCarrinho() {
    if (!produto || produto.estoqueUnidades < quantidade) {
      setToast("Estoque insuficiente para este produto.");
      return;
    }

    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      precoUnitario: produto.precoVenda,
      quantidade,
      observacao,
      imagemUrl: produto.imagemUrl,
    });

    setToast("Produto adicionado ao carrinho.");
    setTimeout(() => setToast(""), 2000);
  }

  if (carregando) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!produto) {
    return <div className="p-6">Produto não encontrado.</div>;
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: theme.colors.background }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 text-sm"
        style={{ color: theme.colors.info }}
      >
        Voltar
      </button>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
        <div className="h-64" style={{ backgroundColor: theme.colors.surfaceAlt }}>
          {produto.imagemUrl ? (
            <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover" />
          ) : null}
        </div>

        <div className="p-4">
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>{produto.nome}</h1>
          <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>{produto.descricao || "Sem descrição"}</p>
          <p className="mt-3 text-xl font-semibold" style={{ color: theme.colors.success }}>
            R$ {produto.precoVenda.toFixed(2)}
          </p>

          <div className="mt-4">
            <label className="text-sm font-medium" style={{ color: theme.colors.primary }}>Quantidade</label>
            <input
              type="number"
              min={1}
              max={Math.max(1, produto.estoqueUnidades)}
              value={quantidade}
              onChange={(event) => setQuantidade(Math.max(1, Number(event.target.value) || 1))}
              className="w-full mt-1 rounded-lg border px-3 py-2"
              style={{ borderColor: theme.colors.border }}
            />
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium" style={{ color: theme.colors.primary }}>Observação</label>
            <textarea
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              rows={3}
              className="w-full mt-1 rounded-lg border px-3 py-2"
              style={{ borderColor: theme.colors.border }}
              placeholder="Ex: sem cebola"
            />
          </div>

          <button
            type="button"
            onClick={handleAdicionarCarrinho}
            className="w-full mt-4 py-3 rounded-lg font-semibold"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
          >
            Adicionar ao carrinho
          </button>

          <Link
            to="/carrinho"
            className="w-full mt-2 py-3 rounded-lg font-semibold block text-center"
            style={{ backgroundColor: theme.colors.surfaceAlt, color: theme.colors.primary }}
          >
            Ir para carrinho
          </Link>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-4 right-4 p-3 rounded-lg text-center" style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}>
          {toast}
        </div>
      )}
    </div>
  );
}
