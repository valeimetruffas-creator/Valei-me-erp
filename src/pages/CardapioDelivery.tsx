import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { ProdutoCardapio } from "../types/DeliveryCliente";
import { garantirAuthClienteDelivery, observarCardapioDelivery } from "../services/deliveryClienteService";
import { theme } from "../styles/theme";

const TAMANHO_PAGINA = 12;

function normalizar(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function CardapioDelivery() {
  const [carregando, setCarregando] = useState(true);
  const [produtos, setProdutos] = useState<ProdutoCardapio[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");
  const [limiteExibicao, setLimiteExibicao] = useState(TAMANHO_PAGINA);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void garantirAuthClienteDelivery();

    const unsubscribe = observarCardapioDelivery((lista) => {
      setProdutos(lista);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setLimiteExibicao((valor) => valor + TAMANHO_PAGINA);
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const categorias = useMemo(() => {
    const lista = Array.from(new Set(produtos.map((produto) => produto.categoria || "Geral"))).sort();
    return ["Todas", ...lista];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = normalizar(busca);

    return produtos.filter((produto) => {
      const categoriaOk = categoriaSelecionada === "Todas" || produto.categoria === categoriaSelecionada;
      const texto = normalizar(`${produto.nome} ${produto.descricao}`);
      const buscaOk = !termo || texto.includes(termo);
      return categoriaOk && buscaOk;
    });
  }, [busca, categoriaSelecionada, produtos]);

  const produtosDestaque = useMemo(() => {
    const destacados = produtosFiltrados.filter((produto) => produto.destaque);
    if (destacados.length > 0) {
      return destacados.slice(0, 8);
    }
    return produtosFiltrados.slice(0, 8);
  }, [produtosFiltrados]);

  const produtosExibidos = produtosFiltrados.slice(0, limiteExibicao);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <header className="sticky top-0 z-10 border-b p-4" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
          Cardápio Delivery
        </h1>

        <div className="mt-3 relative">
          <Search size={18} style={{ position: "absolute", left: 12, top: 11, color: theme.colors.textSecondary }} />
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por produto"
            className="w-full rounded-lg border py-2 pl-10 pr-3"
            style={{ borderColor: theme.colors.border }}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              onClick={() => setCategoriaSelecionada(categoria)}
              className="px-3 py-1 rounded-full text-sm whitespace-nowrap"
              style={{
                backgroundColor: categoriaSelecionada === categoria ? theme.colors.primary : theme.colors.surfaceAlt,
                color: categoriaSelecionada === categoria ? theme.colors.background : theme.colors.textSecondary,
              }}
            >
              {categoria}
            </button>
          ))}
        </div>
      </header>

      {carregando ? (
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: theme.colors.surfaceAlt }} />
          ))}
        </div>
      ) : (
        <main className="p-4 space-y-6">
          {produtosDestaque.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3" style={{ color: theme.colors.primary }}>
                Destaques
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {produtosDestaque.map((produto) => (
                  <Link key={`dest-${produto.id}`} to={`/produto/${produto.id}`} className="rounded-xl overflow-hidden border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                    <div className="h-28" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                      {produto.imagemUrl ? (
                        <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm" style={{ color: theme.colors.primary }}>{produto.nome}</p>
                      <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                        {produto.estoqueUnidades > 0 ? "Disponível" : "Indisponível"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: theme.colors.primary }}>
              Todos os produtos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {produtosExibidos.map((produto) => (
                <Link key={produto.id} to={`/produto/${produto.id}`} className="rounded-xl overflow-hidden border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                  <div className="h-28" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                    {produto.imagemUrl ? (
                      <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm" style={{ color: theme.colors.primary }}>{produto.nome}</p>
                    <p className="text-sm mt-1" style={{ color: theme.colors.success }}>
                      R$ {produto.precoVenda.toFixed(2)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                      {produto.estoqueUnidades > 0 ? "Disponível" : "Indisponível"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div ref={sentinelRef} className="h-8" />
          </section>
        </main>
      )}

      <div className="fixed bottom-4 right-4">
        <Link
          to="/carrinho"
          className="px-4 py-3 rounded-full shadow-lg font-semibold"
          style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
        >
          Ver carrinho
        </Link>
      </div>
    </div>
  );
}
