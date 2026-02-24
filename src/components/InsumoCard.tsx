import { useState } from "react";
import { Insumo } from "../types/Insumo";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { atualizarInsumo } from "../utils/insumoUtils";
import { safeFixed, getPrecoPorGrama } from "../utils/safeNumbers";
import { theme } from "../styles/theme";
import { toast } from "react-toastify";

const CardInsumo = ({ item }: { item: Insumo }) => {
  const { updateInsumo, removeInsumo } = useConfeitariaStore();

  const [editado, setEditado] = useState<Insumo>(item);
  const [salvando, setSalvando] = useState(false);

  const baixoEstoque = editado.estoqueGramas <= editado.minimoGramas;
  const custoPorGrama = getPrecoPorGrama(editado);

  const handleSalvar = () => {
    if (!editado.nome?.trim()) {
      toast.error("Nome não pode estar vazio");
      return;
    }
    if (editado.precoEmbalagem < 0 || editado.pesoEmbalagemGramas <= 0) {
      toast.error("Preço e peso não podem ser negativos ou zero");
      return;
    }
    if (editado.estoqueGramas < 0) {
      toast.error("Estoque não pode ser negativo");
      return;
    }
    if (editado.minimoGramas < 0) {
      toast.error("Estoque mínimo não pode ser negativo");
      return;
    }

    setSalvando(true);
    const insumoAtualizado = atualizarInsumo(item, editado);
    updateInsumo(insumoAtualizado);
    setSalvando(false);
  };

  const handleCancelar = () => {
    setEditado(item);
  };

  const temAlteracoes = JSON.stringify(editado) !== JSON.stringify(item);

  return (
    <div className="p-4 rounded-lg shadow-md border-2 transition-colors" style={{
      backgroundColor: theme.colors.background,
      borderColor: baixoEstoque ? theme.colors.danger : 'transparent'
    }}>
      <div className="mb-3">
        <input
          className="font-bold text-xl bg-transparent border-b-2 focus:outline-none w-full"
          placeholder="Nome do insumo"
          value={editado.nome}
          onChange={(e) => setEditado({ ...editado, nome: e.target.value })}
          disabled={salvando}
          style={{
            color: theme.colors.primary,
            borderColor: theme.colors.primaryLight,
            '--placeholder-opacity': '0.5'
          } as any}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block font-semibold mb-1" style={{ color: theme.colors.primaryDark }}>Embalagens</label>
          <input
            type="number"
            className="w-full rounded px-2 py-1 bg-white focus:outline-none border-2"
            value={editado.estoqueEmbalagens}
            onChange={(e) => {
              const val = Number(e.target.value);
              setEditado({ ...editado, estoqueEmbalagens: val >= 0 ? val : 0 });
            }}
            disabled={salvando}
            min="0"
            style={{
              color: theme.colors.primary,
              borderColor: theme.colors.primaryLight
            }}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" style={{ color: theme.colors.primaryDark }}>Mínimo (g)</label>
          <input
            type="number"
            className="w-full rounded px-2 py-1 bg-white focus:outline-none border-2"
            value={editado.minimoGramas}
            onChange={(e) => {
              const val = Number(e.target.value);
              setEditado({ ...editado, minimoGramas: val >= 0 ? val : 0 });
            }}
            disabled={salvando}
            min="0"
            style={{
              color: theme.colors.primary,
              borderColor: theme.colors.primaryLight
            }}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" style={{ color: theme.colors.primaryDark }}>Peso Emb. (g)</label>
          <input
            type="number"
            step="0.1"
            className="w-full rounded px-2 py-1 bg-white focus:outline-none border-2"
            value={editado.pesoEmbalagemGramas}
            onChange={(e) => {
              const val = Number(e.target.value);
              setEditado({ ...editado, pesoEmbalagemGramas: val > 0 ? val : 1 });
            }}
            disabled={salvando}
            min="0.1"
            style={{
              color: theme.colors.primary,
              borderColor: theme.colors.primaryLight
            }}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" style={{ color: theme.colors.primaryDark }}>Preço Emb. (R$)</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded px-2 py-1 bg-white focus:outline-none border-2"
            value={editado.precoEmbalagem}
            onChange={(e) => {
              const val = Number(e.target.value);
              setEditado({ ...editado, precoEmbalagem: val >= 0 ? val : 0 });
            }}
            disabled={salvando}
            min="0"
            style={{
              color: theme.colors.primary,
              borderColor: theme.colors.primaryLight
            }}
          />
          <div className="text-xs mt-1 font-medium" style={{ color: theme.colors.primaryDark }}>
            Custo/g: R$ {safeFixed(custoPorGrama, 4)}
          </div>
        </div>
      </div>

      {baixoEstoque && (
        <div className="mt-3 p-2 rounded border-l-4" style={{
          backgroundColor: theme.colors.danger + '15',
          borderColor: theme.colors.danger
        }}>
          <p className="font-bold text-sm" style={{ color: theme.colors.danger }}>⚠️ Estoque abaixo do mínimo!</p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSalvar}
          disabled={!temAlteracoes || salvando}
          className="flex-1 text-white py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: theme.colors.primaryDark }}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        
        {temAlteracoes && (
          <button
            onClick={handleCancelar}
            disabled={salvando}
            className="flex-1 bg-gray-500 text-white py-2 rounded font-semibold hover:bg-gray-600 disabled:opacity-50 transition-all"
          >
            Cancelar
          </button>
        )}

        <button
          onClick={() => {
            if (confirm(`Remover "${item.nome}" do estoque?`)) {
              removeInsumo(item.id);
            }
          }}
          disabled={salvando}
          className="flex-1 text-white py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          style={{ backgroundColor: theme.colors.danger }}
        >
          Remover
        </button>
      </div>
    </div>
  );
};

export default CardInsumo;
