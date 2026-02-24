import { ItemVendaPadrao } from "../../types/Venda";
import { calcularSubtotalItem, formatMoneyBR, toNumber } from "../../utils/vendaCalculos";

interface VendaCarrinhoProps {
  itens: ItemVendaPadrao[];
  onAumentar: (id: string) => void;
  onDiminuir: (id: string) => void;
  onRemover: (id: string) => void;
  onAlterarQuantidade: (id: string, quantidade: number) => void;
}

export function VendaCarrinho({
  itens,
  onAumentar,
  onDiminuir,
  onRemover,
  onAlterarQuantidade,
}: VendaCarrinhoProps) {
  return (
    <div className="bg-[#676C3C] p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Carrinho</h2>

      {itens.length === 0 && <p className="text-sm opacity-80">Nenhum item adicionado.</p>}

      <div className="space-y-3">
        {itens.map((item) => {
          const quantidadeAtual = toNumber(item.quantidade);
          const precoUnitarioAtual = toNumber(item.precoUnitario);
          const subtotalAtual = calcularSubtotalItem({
            quantidade: quantidadeAtual,
            precoUnitario: precoUnitarioAtual,
          });

          return (
            <div key={item.id} className="bg-[#784E23] p-3 rounded">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.nome}</p>
                  <p className="text-sm">R$ {formatMoneyBR(precoUnitarioAtual)} un.</p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemover(item.id)}
                  className="text-red-300 text-sm"
                >
                  remover
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onDiminuir(item.id)} className="px-2 rounded bg-[#CDA85B] text-black">
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantidadeAtual}
                    onChange={(e) => onAlterarQuantidade(item.id, Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded text-black"
                  />
                  <button type="button" onClick={() => onAumentar(item.id)} className="px-2 rounded bg-[#CDA85B] text-black">
                    +
                  </button>
                </div>

                <p className="font-bold">R$ {formatMoneyBR(subtotalAtual)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
