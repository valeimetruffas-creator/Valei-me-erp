import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { criarPedidoPublico, obterCardapioPublico } from "../services/publicClienteApi";
import { ProdutoCardapio } from "../types/DeliveryCliente";

type Carrinho = Record<string, { produto: ProdutoCardapio; quantidade: number }>;

export default function ClienteLoja() {
  const { empresaSlug = "" } = useParams();
  const [produtos, setProdutos] = useState<ProdutoCardapio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        setErro("");
        setCarregando(true);
        const data = await obterCardapioPublico(empresaSlug);
        if (ativo) setProdutos(data);
      } catch (error) {
        if (ativo) {
          setErro(error instanceof Error ? error.message : "Erro ao carregar loja");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      ativo = false;
    };
  }, [empresaSlug]);

  const itensCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const total = useMemo(
    () => itensCarrinho.reduce((acc, item) => acc + item.quantidade * item.produto.precoVenda, 0),
    [itensCarrinho],
  );

  const adicionar = (produto: ProdutoCardapio) => {
    setCarrinho((estado) => {
      const atual = estado[produto.id];
      return {
        ...estado,
        [produto.id]: {
          produto,
          quantidade: (atual?.quantidade || 0) + 1,
        },
      };
    });
  };

  const remover = (produtoId: string) => {
    setCarrinho((estado) => {
      const atual = estado[produtoId];
      if (!atual) return estado;
      if (atual.quantidade <= 1) {
        const novo = { ...estado };
        delete novo[produtoId];
        return novo;
      }
      return {
        ...estado,
        [produtoId]: { ...atual, quantidade: atual.quantidade - 1 },
      };
    });
  };

  const finalizar = async () => {
    if (!nome.trim() || !whatsapp.trim() || itensCarrinho.length === 0) {
      setMensagem("Preencha nome, whatsapp e adicione itens ao carrinho.");
      return;
    }

    setEnviando(true);
    setMensagem("");

    try {
      const pedido = await criarPedidoPublico(empresaSlug, {
        cliente: { nome: nome.trim(), whatsapp: whatsapp.trim() },
        endereco: { tipo: "entrega" },
        pagamento: { tipo: "pix" },
        observacao: "",
        formaPagamento: "pix",
        entrega: { tipo: "entrega" },
        itens: itensCarrinho.map((item) => ({
          produtoId: item.produto.id,
          nome: item.produto.nome,
          quantidade: item.quantidade,
          precoUnitario: item.produto.precoVenda,
        })),
      } as any);

      setMensagem(`Pedido enviado com sucesso! Nº ${pedido.id}`);
      setCarrinho({});
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Falha ao enviar pedido");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <section className="bg-white rounded-xl shadow p-4 md:p-6">
          <h1 className="text-2xl font-bold mb-1">Loja {empresaSlug}</h1>
          <p className="text-slate-500 mb-4">Cardápio online</p>

          {carregando && <p>Carregando cardápio...</p>}
          {erro && <p className="text-red-600">{erro}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {produtos.map((produto) => (
              <article key={produto.id} className="border rounded-lg p-3">
                <h2 className="font-semibold">{produto.nome}</h2>
                <p className="text-sm text-slate-500">{produto.descricao}</p>
                <p className="font-bold mt-2">R$ {produto.precoVenda.toFixed(2)}</p>
                <div className="mt-3 flex gap-2">
                  <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={() => adicionar(produto)}>
                    Adicionar
                  </button>
                  <button className="px-3 py-2 rounded bg-slate-200" onClick={() => remover(produto.id)}>
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="bg-white rounded-xl shadow p-4 md:p-6 h-fit">
          <h2 className="text-lg font-bold mb-3">Seu pedido</h2>
          <div className="space-y-2 mb-4">
            {itensCarrinho.map((item) => (
              <div key={item.produto.id} className="flex justify-between text-sm">
                <span>{item.quantidade}x {item.produto.nome}</span>
                <span>R$ {(item.quantidade * item.produto.precoVenda).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <p className="font-bold mb-4">Total: R$ {total.toFixed(2)}</p>

          <input
            className="w-full border rounded p-2 mb-2"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            className="w-full border rounded p-2 mb-3"
            placeholder="WhatsApp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />

          <button
            className="w-full bg-rose-600 text-white rounded p-2 font-semibold disabled:opacity-60"
            disabled={enviando}
            onClick={() => {
              void finalizar();
            }}
          >
            {enviando ? "Enviando..." : "Finalizar pedido"}
          </button>

          {mensagem && <p className="text-sm mt-3">{mensagem}</p>}
        </aside>
      </div>
    </div>
  );
}
