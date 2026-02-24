import { KeyboardEvent, useMemo, useState } from "react";
import { ProdutoFinal } from "../../services/produtoFinalService";

interface VendaProdutoBuscaProps {
  produtos: ProdutoFinal[];
  loading: boolean;
  onAdicionar: (produto: ProdutoFinal) => void;
}

export function VendaProdutoBusca({ produtos, loading, onAdicionar }: VendaProdutoBuscaProps) {
  const [busca, setBusca] = useState("");

  const normalizarTexto = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const buscaAtiva = busca.trim().length > 0;

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) {
      return [];
    }

    const termosBusca = termo.split(/\s+/).filter(Boolean);

    return produtos.filter((produto) => {
      const alvo = normalizarTexto(`${produto.nome} ${produto.categoria || ""}`);
      return termosBusca.every((termoItem) => alvo.includes(termoItem));
    });
  }, [produtos, busca]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && buscaAtiva && produtosFiltrados.length > 0) {
      onAdicionar(produtosFiltrados[0]);
    }
  }

  return (
    <div className="bg-[#676C3C] p-4 rounded-lg space-y-3">
      <h2 className="text-xl font-semibold">Busca Rápida (PDV)</h2>

      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2 rounded text-black"
        />

        <button
          type="button"
          onClick={() => setBusca("")}
          className="bg-[#CDA85B] text-black font-semibold px-3 py-2 rounded"
        >
          Limpar busca
        </button>
      </div>

      {!buscaAtiva ? (
        <p className="text-sm opacity-90">Digite nome, categoria ou palavra-chave para buscar</p>
      ) : loading ? (
        <p className="text-sm opacity-90">Carregando produtos...</p>
      ) : produtosFiltrados.length === 0 ? (
        <p className="text-sm opacity-90">Nenhum produto encontrado</p>
      ) : (
        <div className="max-h-64 overflow-auto space-y-2">
          {produtosFiltrados.map((produto) => (
            <div
              key={produto.id}
              className="bg-[#784E23] p-2 rounded flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-semibold">{produto.nome}</p>
                <p className="text-sm">R$ {produto.precoVenda.toFixed(2)}</p>
              </div>

              <button
                type="button"
                onClick={() => onAdicionar(produto)}
                className="bg-[#CDA85B] text-black font-semibold px-3 py-1 rounded"
              >
                Adicionar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
