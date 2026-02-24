import { Link, useNavigate } from "react-router-dom";
import { useDeliveryClienteStore } from "../store/useDeliveryClienteStore";
import { theme } from "../styles/theme";

export default function CarrinhoDelivery() {
  const navigate = useNavigate();
  const itens = useDeliveryClienteStore((state) => state.itensCarrinho);
  const observacaoGeral = useDeliveryClienteStore((state) => state.observacaoGeral);
  const atualizarQuantidade = useDeliveryClienteStore((state) => state.atualizarQuantidade);
  const removerItem = useDeliveryClienteStore((state) => state.removerItem);
  const definirObservacaoGeral = useDeliveryClienteStore((state) => state.definirObservacaoGeral);
  const totalCarrinho = useDeliveryClienteStore((state) => state.totalCarrinho);

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: theme.colors.background }}>
      <h1 className="text-2xl font-bold mb-4" style={{ color: theme.colors.primary }}>Seu carrinho</h1>

      {itens.length === 0 ? (
        <div className="rounded-xl p-5" style={{ backgroundColor: theme.colors.surface }}>
          Carrinho vazio.
          <Link to="/cardapio" className="block mt-3" style={{ color: theme.colors.info }}>
            Voltar ao cardápio
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {itens.map((item) => (
              <div key={`${item.produtoId}-${item.observacao}`} className="rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: theme.colors.primary }}>{item.nome}</p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      R$ {item.precoUnitario.toFixed(2)}
                    </p>
                    {item.observacao && (
                      <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                        Obs: {item.observacao}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removerItem(item.produtoId)}
                    className="text-sm"
                    style={{ color: theme.colors.danger }}
                  >
                    Remover
                  </button>
                </div>

                <input
                  type="number"
                  min={1}
                  value={item.quantidade}
                  onChange={(event) => atualizarQuantidade(item.produtoId, Math.max(1, Number(event.target.value) || 1))}
                  className="mt-2 w-24 rounded-lg border px-2 py-1"
                  style={{ borderColor: theme.colors.border }}
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium" style={{ color: theme.colors.primary }}>Observação geral</label>
            <textarea
              value={observacaoGeral}
              onChange={(event) => definirObservacaoGeral(event.target.value)}
              rows={3}
              className="w-full mt-1 rounded-lg border px-3 py-2"
              style={{ borderColor: theme.colors.border }}
            />
          </div>

          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
            <p className="font-semibold" style={{ color: theme.colors.primary }}>
              Total: R$ {totalCarrinho().toFixed(2)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="w-full mt-4 py-3 rounded-lg font-semibold"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
          >
            Ir para checkout
          </button>
        </>
      )}
    </div>
  );
}
