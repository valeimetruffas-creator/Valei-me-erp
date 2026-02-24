import { ItemVendaPadrao } from "../../types/Venda";
import { formatMoneyBR, toNumber } from "../../utils/vendaCalculos";

interface VendaResumoProps {
  itens: ItemVendaPadrao[];
  subtotal?: number;
  desconto: number;
  acrescimo: number;
  total?: number;
  onChangeDesconto: (valor: number) => void;
  onChangeAcrescimo: (valor: number) => void;
  onAplicarDescontoPercentual: (percentual: number) => void;
}

export function VendaResumo({
  itens,
  subtotal,
  desconto,
  acrescimo,
  total,
  onChangeDesconto,
  onChangeAcrescimo,
  onAplicarDescontoPercentual,
}: VendaResumoProps) {
  const subtotalCalculado = itens.reduce((acc, item) => {
    const quantidade = toNumber(item.quantidade);
    const precoUnitario = toNumber(item.precoUnitario);
    const subtotalItem = quantidade * precoUnitario;
    return acc + subtotalItem;
  }, 0);

  const totalCalculado = subtotalCalculado - toNumber(desconto) + toNumber(acrescimo);

  const subtotalExibicao = Number.isFinite(subtotalCalculado) ? subtotalCalculado : toNumber(subtotal);
  const totalExibicao = Number.isFinite(totalCalculado) ? totalCalculado : toNumber(total);

  return (
    <div className="bg-[#676C3C] p-4 rounded-lg space-y-3">
      <h2 className="text-xl font-semibold">Resumo</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="number"
          min={0}
          step={0.01}
          value={toNumber(desconto)}
          onChange={(e) => onChangeDesconto(Number(e.target.value))}
          placeholder="Desconto"
          className="p-2 rounded text-black"
        />
        <input
          type="number"
          min={0}
          step={0.01}
          value={toNumber(acrescimo)}
          onChange={(e) => onChangeAcrescimo(Number(e.target.value))}
          placeholder="Acréscimo"
          className="p-2 rounded text-black"
        />

        <div className="font-bold text-lg flex items-center justify-end">
          Total: R$ {formatMoneyBR(totalExibicao)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Desconto rápido:</span>
        <button type="button" onClick={() => onAplicarDescontoPercentual(5)} className="bg-[#CDA85B] text-black px-3 py-1 rounded">
          -5%
        </button>
        <button type="button" onClick={() => onAplicarDescontoPercentual(10)} className="bg-[#CDA85B] text-black px-3 py-1 rounded">
          -10%
        </button>
        <button type="button" onClick={() => onAplicarDescontoPercentual(15)} className="bg-[#CDA85B] text-black px-3 py-1 rounded">
          -15%
        </button>
      </div>

      <div className="text-sm opacity-90">
        <p>Subtotal itens: R$ {formatMoneyBR(subtotalExibicao)}</p>
      </div>
    </div>
  );
}
