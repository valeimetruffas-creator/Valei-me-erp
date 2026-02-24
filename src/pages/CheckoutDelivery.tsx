import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finalizarPedidoDelivery } from "../services/deliveryClienteService";
import { useDeliveryClienteStore } from "../store/useDeliveryClienteStore";
import { theme } from "../styles/theme";

export default function CheckoutDelivery() {
  const navigate = useNavigate();
  const itens = useDeliveryClienteStore((state) => state.itensCarrinho);
  const observacaoGeral = useDeliveryClienteStore((state) => state.observacaoGeral);
  const limparCarrinho = useDeliveryClienteStore((state) => state.limparCarrinho);
  const total = useDeliveryClienteStore((state) => state.totalCarrinho)();

  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState("");

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">("entrega");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [referencia, setReferencia] = useState("");
  const [cep, setCep] = useState("");
  const [pagamento, setPagamento] = useState<"dinheiro" | "pix" | "cartao">("pix");
  const [trocoPara, setTrocoPara] = useState(0);

  const enderecoValido = useMemo(() => {
    if (tipoEntrega === "retirada") {
      return true;
    }
    return Boolean(logradouro && numero && bairro && cidade);
  }, [bairro, cidade, logradouro, numero, tipoEntrega]);

  async function handleFinalizarPedido() {
    if (!nome || !whatsapp || itens.length === 0 || !enderecoValido) {
      setToast("Preencha os dados obrigatórios para finalizar.");
      return;
    }

    try {
      setEnviando(true);
      const resposta = await finalizarPedidoDelivery({
        cliente: { nome, whatsapp },
        endereco: {
          tipo: tipoEntrega,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          referencia,
          cep,
        },
        pagamento: {
          tipo: pagamento,
          trocoPara: pagamento === "dinheiro" ? trocoPara : 0,
        },
        observacao: observacaoGeral,
      });

      limparCarrinho();
      navigate(`/pedido/${resposta.pedidoId}`);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Falha ao finalizar pedido";
      setToast(mensagem);
    } finally {
      setEnviando(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: theme.colors.background }}>
      <h1 className="text-2xl font-bold mb-4" style={{ color: theme.colors.primary }}>Checkout</h1>

      <div className="space-y-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
          <input className="w-full border rounded-lg px-3 py-2 mb-2" style={{ borderColor: theme.colors.border }} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
          <p className="font-medium mb-2" style={{ color: theme.colors.primary }}>Tipo</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setTipoEntrega("entrega")} className="px-3 py-2 rounded-lg" style={{ backgroundColor: tipoEntrega === "entrega" ? theme.colors.primary : theme.colors.surfaceAlt, color: tipoEntrega === "entrega" ? theme.colors.background : theme.colors.primary }}>Entrega</button>
            <button type="button" onClick={() => setTipoEntrega("retirada")} className="px-3 py-2 rounded-lg" style={{ backgroundColor: tipoEntrega === "retirada" ? theme.colors.primary : theme.colors.surfaceAlt, color: tipoEntrega === "retirada" ? theme.colors.background : theme.colors.primary }}>Retirada</button>
          </div>

          {tipoEntrega === "entrega" && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="Logradouro" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
              <input className="border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
              <input className="border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
              <input className="border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
              <input className="border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
              <input className="border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} />
              <input className="border rounded-lg px-3 py-2 md:col-span-2" style={{ borderColor: theme.colors.border }} placeholder="Referência" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>
          )}
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
          <p className="font-medium mb-2" style={{ color: theme.colors.primary }}>Pagamento</p>
          <select className="w-full border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} value={pagamento} onChange={(e) => setPagamento(e.target.value as "dinheiro" | "pix" | "cartao") }>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão</option>
          </select>

          {pagamento === "dinheiro" && (
            <input className="w-full mt-2 border rounded-lg px-3 py-2" style={{ borderColor: theme.colors.border }} placeholder="Troco para" type="number" value={trocoPara} onChange={(e) => setTrocoPara(Number(e.target.value) || 0)} />
          )}
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.surface }}>
          <p style={{ color: theme.colors.primary }}>Total do pedido</p>
          <p className="text-xl font-semibold" style={{ color: theme.colors.success }}>R$ {total.toFixed(2)}</p>
        </div>
      </div>

      <button type="button" onClick={() => { void handleFinalizarPedido(); }} disabled={enviando} className="w-full mt-4 py-3 rounded-lg font-semibold disabled:opacity-60" style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}>
        {enviando ? "Enviando pedido..." : "Finalizar pedido"}
      </button>

      {toast && <div className="fixed bottom-4 left-4 right-4 p-3 rounded-lg text-center" style={{ backgroundColor: theme.colors.danger, color: theme.colors.background }}>{toast}</div>}
    </div>
  );
}
