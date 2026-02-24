import { useState } from "react";
import { ItemVendaPadrao } from "../../types/Venda";

interface NovoItemManual {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

interface VendaManualProps {
  itens: ItemVendaPadrao[];
  onAdicionar: (item: NovoItemManual) => void;
  onEditar: (id: string, item: NovoItemManual) => void;
  onRemover: (id: string) => void;
}

export function VendaManual({ itens, onAdicionar, onEditar, onRemover }: VendaManualProps) {
  const [novoItem, setNovoItem] = useState<NovoItemManual>({
    nome: "",
    quantidade: 1,
    precoUnitario: 0,
  });

  const [edicao, setEdicao] = useState<Record<string, NovoItemManual>>({});

  function handleAdicionar() {
    onAdicionar(novoItem);
    setNovoItem({ nome: "", quantidade: 1, precoUnitario: 0 });
  }

  return (
    <div className="bg-[#676C3C] p-4 rounded-lg space-y-4">
      <h2 className="text-xl font-semibold">Venda Completa (Manual)</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={novoItem.nome}
          onChange={(e) => setNovoItem((prev) => ({ ...prev, nome: e.target.value }))}
          placeholder="Nome do item"
          className="p-2 rounded text-black"
        />
        <input
          type="number"
          min={1}
          value={novoItem.quantidade}
          onChange={(e) => setNovoItem((prev) => ({ ...prev, quantidade: Number(e.target.value) }))}
          placeholder="Quantidade"
          className="p-2 rounded text-black"
        />
        <input
          type="number"
          min={0}
          step={0.01}
          value={novoItem.precoUnitario}
          onChange={(e) => setNovoItem((prev) => ({ ...prev, precoUnitario: Number(e.target.value) }))}
          placeholder="Preço unitário"
          className="p-2 rounded text-black"
        />
        <button type="button" onClick={handleAdicionar} className="bg-[#CDA85B] text-black rounded font-semibold">
          Adicionar Item
        </button>
      </div>

      <div className="space-y-3">
        {itens.map((item) => {
          const itemEdicao = edicao[item.id] ?? {
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
          };

          return (
            <div key={item.id} className="bg-[#784E23] p-3 rounded grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
              <input
                value={itemEdicao.nome}
                onChange={(e) =>
                  setEdicao((prev) => ({
                    ...prev,
                    [item.id]: { ...itemEdicao, nome: e.target.value },
                  }))
                }
                className="p-2 rounded text-black"
              />
              <input
                type="number"
                min={1}
                value={itemEdicao.quantidade}
                onChange={(e) =>
                  setEdicao((prev) => ({
                    ...prev,
                    [item.id]: { ...itemEdicao, quantidade: Number(e.target.value) },
                  }))
                }
                className="p-2 rounded text-black"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={itemEdicao.precoUnitario}
                onChange={(e) =>
                  setEdicao((prev) => ({
                    ...prev,
                    [item.id]: { ...itemEdicao, precoUnitario: Number(e.target.value) },
                  }))
                }
                className="p-2 rounded text-black"
              />

              <div className="font-semibold">R$ {item.subtotal.toFixed(2)}</div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEditar(item.id, itemEdicao)}
                  className="bg-[#CDA85B] text-black px-3 rounded"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => onRemover(item.id)}
                  className="bg-red-400 text-black px-3 rounded"
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}

        {itens.length === 0 && <p className="text-sm opacity-80">Nenhum item manual adicionado.</p>}
      </div>
    </div>
  );
}
