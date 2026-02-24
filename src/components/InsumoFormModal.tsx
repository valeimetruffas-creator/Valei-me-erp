import { useState } from "react";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { theme } from "../styles/theme";
import { toast } from "react-toastify";

interface Props {
  onClose: () => void;
}

export function InsumoFormModal({ onClose }: Props) {
  const { addInsumo } = useConfeitariaStore();
  const [nome, setNome] = useState("");

  function salvar() {
    if (!nome) {
      toast.error("Nome obrigatório");
      return;
    }

    addInsumo({
      id: crypto.randomUUID(),
      nome,
      pesoEmbalagemGramas: 0,
      precoEmbalagem: 0,
      estoqueEmbalagens: 0,
      estoqueGramas: 0,
      precoPorGrama: 0,
      minimoGramas: 1000
    });

    toast.success("Insumo criado com sucesso.");

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="p-6 rounded-xl w-96" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary }}>Novo Insumo</h2>

        <input
          placeholder="Nome do insumo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full p-2 rounded mb-4 border"
          style={{ borderColor: theme.colors.primaryLight, color: theme.colors.primary }}
        />

        <div className="flex gap-2">
          <button
            onClick={salvar}
            className="flex-1 text-white p-2 rounded hover:opacity-90"
            style={{ backgroundColor: theme.colors.primaryDark }}
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            className="flex-1 text-white p-2 rounded hover:opacity-90"
            style={{ backgroundColor: theme.colors.border }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
