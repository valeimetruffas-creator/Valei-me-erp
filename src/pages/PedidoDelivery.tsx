import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { observarPedidoDelivery } from "../services/deliveryClienteService";
import type { PedidoDelivery } from "../types/DeliveryCliente";
import { useDeliveryClienteStore } from "../store/useDeliveryClienteStore";
import { theme } from "../styles/theme";

function labelStatus(status: string): string {
  switch (status) {
    case "aceito":
      return "Aceito";
    case "preparando":
      return "Preparando";
    case "saiu":
    case "saiu_entrega":
      return "Saiu para entrega";
    case "entregue":
      return "Entregue";
    default:
      return "Pendente";
  }
}

export default function PedidoDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const repetirPedido = useDeliveryClienteStore((state) => state.repetirPedido);

  const [pedido, setPedido] = useState<PedidoDelivery | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = observarPedidoDelivery(id, setPedido);
    return () => unsubscribe();
  }, [id]);

  const whatsappLink = useMemo(() => {
    if (!pedido) return "";
    const texto = encodeURIComponent(`Olá! Pedido ${pedido.id} - status: ${labelStatus(pedido.status)}`);
    return `https://api.whatsapp.com/send?text=${texto}`;
  }, [pedido]);

  function handleRepetirPedido() {
    if (!pedido) return;

    repetirPedido(
      pedido.itens.map((item) => ({
        produtoId: item.produtoId,
        nome: item.nome,
        precoUnitario: item.precoUnitario,
        quantidade: item.quantidade,
        observacao: item.observacao || "",
        imagemUrl: "",
      }))
    );

    navigate("/carrinho");
  }

  if (!pedido) {
    return <div className="p-6">Aguardando atualização do pedido...</div>;
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: theme.colors.background }}>
      <h1 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>Pedido #{pedido.id}</h1>

      <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
        <p><strong>Status:</strong> {labelStatus(pedido.status)}</p>
        <p><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>
        <p><strong>Tempo estimado:</strong> {pedido.tempoEstimadoMinutos || 45} min</p>
      </div>

      <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
        <p className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Itens</p>
        {pedido.itens.map((item) => (
          <div key={`${item.produtoId}-${item.nome}`} className="text-sm py-1" style={{ color: theme.colors.textSecondary }}>
            {item.nome} • {item.quantidade}x • R$ {item.precoUnitario.toFixed(2)}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleRepetirPedido} className="px-4 py-2 rounded-lg" style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}>
          Repetir pedido
        </button>

        <a href={whatsappLink} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg" style={{ backgroundColor: theme.colors.success, color: theme.colors.background }}>
          WhatsApp
        </a>

        <Link to="/cardapio" className="px-4 py-2 rounded-lg" style={{ backgroundColor: theme.colors.surfaceAlt, color: theme.colors.primary }}>
          Voltar ao cardápio
        </Link>
      </div>
    </div>
  );
}
