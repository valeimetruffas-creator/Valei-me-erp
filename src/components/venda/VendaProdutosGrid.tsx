import { ProdutoFinal } from "../../services/produtoFinalService";

interface VendaProdutosGridProps {
  produtos: ProdutoFinal[];
  onAdicionar: (produto: ProdutoFinal) => void;
}

export function VendaProdutosGrid({ produtos, onAdicionar }: VendaProdutosGridProps) {
  return (
    <div className="bg-[#676C3C] p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Produtos</h2>

      {produtos.length === 0 ? (
        <p className="text-sm opacity-80">Nenhum produto final cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {produtos.map((produto) => (
            <button
              key={produto.id}
              onClick={() => onAdicionar(produto)}
              className="text-left bg-[#CDA85B] text-black p-3 rounded hover:opacity-90"
            >
              <p className="font-bold">{produto.nome}</p>
              <p className="text-sm">{produto.categoria}</p>
              <p className="font-semibold">R$ {produto.precoVenda.toFixed(2)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
