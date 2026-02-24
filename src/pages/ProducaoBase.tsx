import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { listarBases, Base } from "../services/baseService";
import {
  produzirBase,
  getEstoqueBases,
  EstoqueBase,
} from "../services/estoqueBaseService";
import { toast } from "react-toastify";

export default function ProducaoBase() {
  const [bases, setBases] = useState<Base[]>([]);
  const [estoqueBases, setEstoqueBases] = useState<EstoqueBase[]>([]);
  const [baseSelecionada, setBaseSelecionada] = useState<Base | null>(null);
  const [quantidade, setQuantidade] = useState<number>(0);

  useEffect(() => {
    setBases(listarBases());
    setEstoqueBases(getEstoqueBases());
  }, []);

  const atualizarEstoque = () => {
    setEstoqueBases(getEstoqueBases());
  };

  const handleProduzir = async () => {
    if (!baseSelecionada || quantidade <= 0) {
      toast.error("Selecione uma base e informe a quantidade produzida");
      return;
    }

    await produzirBase(baseSelecionada, quantidade);
    atualizarEstoque();

    toast.success("Base produzida e estoque atualizado!");
    setQuantidade(0);
  };

  return (
    <div className="p-6 pt-20 min-h-screen bg-[#784E23] text-black">
      <motion.h1
        className="text-3xl font-extrabold text-[#FDEDD2] mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Produção de Bases
      </motion.h1>

      {/* Seleção da Base */}
      <div className="bg-[#676C3C] rounded-2xl p-6 shadow mb-6">
        <h2 className="text-xl font-bold mb-4 text-[#FDEDD2]">
          Produzir Base
        </h2>

        <select
          className="w-full mb-4 px-3 py-2 rounded"
          value={baseSelecionada?.id || ""}
          onChange={(e) => {
            const base = bases.find(b => b.id === e.target.value);
            setBaseSelecionada(base || null);
          }}
        >
          <option value="">Selecione a base</option>
          {bases.map(base => (
            <option key={base.id} value={base.id}>
              {base.nome}
            </option>
          ))}
        </select>

        {baseSelecionada && (
          <div className="mb-4 text-[#FDEDD2]">
            <p>
              <strong>Rendimento padrão:</strong>{" "}
              {baseSelecionada.rendimento} g
            </p>
          </div>
        )}

        <input
          type="number"
          placeholder="Quantidade a produzir (g)"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="w-full px-3 py-2 rounded mb-4"
        />

        <button
          onClick={handleProduzir}
          className="w-full bg-[#CDA85B] text-black font-semibold py-2 rounded hover:brightness-110"
        >
          Produzir Base
        </button>
      </div>

      {/* Estoque de Bases */}
      <div className="bg-[#676C3C] rounded-2xl p-6 shadow">
        <h2 className="text-xl font-bold mb-4 text-[#FDEDD2]">
          Estoque de Bases
        </h2>

        {estoqueBases.length === 0 ? (
          <p className="text-[#FDEDD2] text-sm">
            Nenhuma base produzida ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {estoqueBases.map((item) => (
              <li
                key={item.baseId}
                className="flex justify-between bg-[#FDEDD2] p-3 rounded"
              >
                <span className="font-semibold">{item.nome}</span>
                <span>{item.quantidade.toFixed(0)} g</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
