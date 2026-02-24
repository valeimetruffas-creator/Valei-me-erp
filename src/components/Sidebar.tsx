// src/components/Sidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/Logo-pequena.png";
import { ShoppingBag, Box, DollarSign, FileText, Warehouse, BarChart3, Settings, ClipboardList } from "lucide-react";
import { theme } from "../styles/theme";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Início", icon: <ShoppingBag size={20} /> },
    { to: "/produtos", label: "Produtos", icon: <Box size={20} /> },
    { to: "/estoque", label: "Estoque", icon: <Warehouse size={20} /> },
    { to: "/compras", label: "Compras", icon: <FileText size={20} /> },
    { to: "/venda", label: "Vendas", icon: <DollarSign size={20} /> },
    { to: "/fichatecnica", label: "Ficha Técnica", icon: <FileText size={20} /> },
    { to: "/financeiro", label: "Financeiro", icon: <BarChart3 size={20} /> },
    { to: "/pedidos", label: "Pedidos", icon: <ClipboardList size={20} /> },
    { to: "/pedidos/nao-mapeados", label: "Não Mapeados", icon: <ClipboardList size={20} /> },
    { to: "/configuracoes", label: "Configurações", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-64 flex flex-col shadow-lg z-50" style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primaryDark }}>
      <div className="flex items-center justify-center h-20">
        <img src={Logo} alt="Logo" className="h-20" />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-2 px-4 py-3 rounded-lg transition"
            style={{
              backgroundColor: location.pathname === link.to ? theme.colors.primaryDark + '20' : 'transparent',
              fontWeight: location.pathname === link.to ? 'bold' : 'normal',
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== link.to) {
                e.currentTarget.style.backgroundColor = theme.colors.primaryDark + '15';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== link.to) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
