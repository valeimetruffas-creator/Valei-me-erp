import { useState } from "react";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { toast } from "react-toastify";

export default function RegistrarProducao() {
  const { fichas, insumos, produzirProduto } = useConfeitariaStore();
  const [fichaSelecionada, setFichaSelecionada] = useState<string>("");
  const [quantidadeProduzida, setQuantidadeProduzida] = useState<number>(1);

  const handleProducao = () => {
    if (!fichaSelecionada) {
      toast.error("Selecione uma ficha técnica!");
      return;
    }

    if (quantidadeProduzida <= 0) {
      toast.error("Informe uma quantidade válida!");
      return;
    }

    const ficha = fichas.find(f => f.id === fichaSelecionada);
    if (!ficha) return;

    const faltando = ficha.itens.filter(item => {
      const insumo = insumos.find(i => i.id === item.insumoId);
      if (!insumo) return true;
      const necessario = Number(item.quantidadeGramas ?? 0) * quantidadeProduzida;
      return Number(insumo.estoqueGramas ?? 0) < necessario;
    });

    if (faltando.length > 0) {
      const nomesFaltando = faltando.map(item => {
        const insumo = insumos.find(i => i.id === item.insumoId);
        return insumo?.nome || "Insumo desconhecido";
      });
      
      toast.error("Estoque insuficiente para os insumos selecionados.");
      return;
    }

    produzirProduto(fichaSelecionada, quantidadeProduzida);

    const alertasBaixoEstoque = insumos
      .filter(i => Number(i.estoqueGramas ?? 0) <= Number(i.minimoGramas ?? 0))
      .map(i => `⚠️ ${i.nome} está abaixo do estoque mínimo!`);

    if (alertasBaixoEstoque.length > 0) {
      toast.success("Produção registrada com alertas de baixo estoque.");
    } else {
      toast.success("Produção registrada e estoque atualizado!");
    }

    setFichaSelecionada("");
    setQuantidadeProduzida(1);
  };

  const fichaAtual = fichas.find(f => f.id === fichaSelecionada);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">
        📦 Registrar Produção
      </h2>

      <select
        className="border p-2 rounded w-full mb-3"
        onChange={(e) => setFichaSelecionada(e.target.value)}
        value={fichaSelecionada}
      >
        <option value="">Selecione uma ficha técnica</option>
        {fichas.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome}
          </option>
        ))}
      </select>

      <input
        type="number"
        min="1"
        value={quantidadeProduzida}
        onChange={(e) => setQuantidadeProduzida(Number(e.target.value))}
        className="border p-2 rounded w-full mb-3"
        placeholder="Quantidade a produzir"
      />

      <button
        onClick={handleProducao}
        className="bg-green-600 text-white p-2 rounded w-full hover:bg-green-700"
      >
        Registrar Produção
      </button>

      {fichaAtual && (
        <div className="mt-5">
          <h3 className="font-semibold mb-2 text-gray-700">
            Insumos necessários:
          </h3>
          <ul className="list-disc pl-5 text-sm">
            {fichaAtual.itens.map((item) => {
              const insumo = insumos.find(i => i.id === item.insumoId);
              const necessario = Number(item.quantidadeGramas ?? 0) * quantidadeProduzida;
              const disponivel = insumo?.estoqueGramas || 0;
              const suficiente = disponivel >= necessario;

              return (
                <li key={item.insumoId} className={suficiente ? "text-green-700" : "text-red-600"}>
                  {insumo?.nome || "Insumo não encontrado"} – {necessario.toFixed(2)}g
                  {!suficiente && ` (faltam ${(necessario - disponivel).toFixed(2)}g)`}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-semibold">Custo estimado da produção:</p>
            <p className="text-lg">R$ {(fichaAtual.custoTotal * quantidadeProduzida / fichaAtual.rendimento).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
