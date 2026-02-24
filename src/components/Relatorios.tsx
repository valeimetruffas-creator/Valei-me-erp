import React, { useEffect, useState } from "react";

interface Produto {
  nome: string;
  quantidade: number;
  preco: number;
}

interface Compra {
  id: string;
  fornecedor: string;
  data: string;
  total: number;
  produtos: Produto[];
}

export default function Relatorios() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");
  const [filtradas, setFiltradas] = useState<Compra[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("compras-insumos");
    if (saved) setCompras(JSON.parse(saved));
  }, []);

  const filtrar = () => {
    const inicio = filtroInicio ? new Date(filtroInicio) : null;
    const fim = filtroFim ? new Date(filtroFim) : null;
    const lista = compras.filter((c) => {
      const dataCompra = new Date(c.data);
      if (inicio && dataCompra < inicio) return false;
      if (fim && dataCompra > fim) return false;
      return true;
    });
    setFiltradas(lista);
  };

  const totalPeriodo = filtradas.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="p-6 pt-20 min-h-screen bg-rose-50 text-black">
      <h1 className="text-3xl font-bold text-pink-600 mb-4">📊 Relatórios de Compras</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm">Início:</label>
          <input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} className="p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm">Fim:</label>
          <input type="date" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} className="p-2 border rounded" />
        </div>
        <button
          onClick={filtrar}
          className="self-end bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>

      {filtradas.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700">Total no período: R$ {totalPeriodo.toFixed(2)}</h2>
        </div>
      )}

      {filtradas.length === 0 ? (
        <p className="text-gray-600">Nenhuma compra no período selecionado.</p>
      ) : (
        <div className="space-y-4">
          {filtradas.map((compra) => (
            <div key={compra.id} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-lg font-semibold">{compra.fornecedor}</p>
                  <p className="text-sm text-gray-500">{new Date(compra.data).toLocaleString("pt-BR")}</p>
                </div>
                <p className="font-bold text-pink-600">Total: R$ {compra.total.toFixed(2)}</p>
              </div>
              <ul className="text-sm text-gray-800 list-disc pl-6">
                {compra.produtos.map((p, i) => (
                  <li key={i}>{p.nome} - {p.quantidade}x R$ {p.preco.toFixed(2)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
