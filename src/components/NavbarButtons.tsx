import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const buttons = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Produtos" },
  { to: "/cadastrar", label: "Cadastrar" },
  { to: "/estoque", label: "Estoque" },
  { to: "/venda", label: "Vendas" },
];

export default function NavbarButtons() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center gap-4 flex-wrap mt-6">
      {buttons.map(({ to, label }) => {
        const isActive = location.pathname === to;
        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`font-semibold py-2 px-5 rounded shadow text-sm transition ${
              isActive
                ? "bg-pink-500 text-white hover:bg-pink-600"
                : "bg-white text-pink-800 hover:bg-pink-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
