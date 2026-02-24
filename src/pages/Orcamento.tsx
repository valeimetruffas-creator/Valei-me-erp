import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Orcamento() {
  const navigate = useNavigate();
  const location = useLocation();
  const { products, total, client } = location.state || {};

  if (!products || !client) {
    return (
      <div className="p-6 pt-20 min-h-screen bg-[#3B1E1E] text-white">
        <h1 className="text-2xl font-bold">Nenhum orçamento encontrado.</h1>
        <button
          onClick={() => navigate("/carrinho")}
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded"
        >
          Voltar ao Carrinho
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20 min-h-screen bg-[#3B1E1E] text-white">
      <h1 className="text-3xl font-bold mb-6">Orçamento</h1>

      <div className="bg-[#1E4D3B] p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Dados do Cliente</h2>
        <p>Nome: {client.name}</p>
        <p>Telefone: {client.phone}</p>
        <p>Endereço: {client.address}</p>
      </div>

      <div className="mt-6 bg-[#1E4D3B] p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Produtos</h2>
        {products.map((p, i) => (
          <div key={i} className="flex justify-between">
            <span>{p.name} x{p.quantity}</span>
            <span>R$ {(p.price * p.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
          <span>Total:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate("/carrinho")}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          Voltar ao Carrinho
        </button>
      </div>
    </div>
  );
}
