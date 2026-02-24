import { Routes, Route, Navigate } from "react-router-dom";
import Produtos from "./pages/Produtos";
import Compras from "./pages/Compras";
import Venda from "./pages/Venda";
import { FinanceiroPage } from "./pages/FinanceiroPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/compras" element={<Compras />} />
      <Route path="/venda" element={<Venda />} />
      <Route path="/vendas" element={<Navigate to="/venda" replace />} />
      <Route path="/pdv" element={<Navigate to="/venda" replace />} />
      <Route path="/financeiro" element={<FinanceiroPage />} />
    </Routes>
  );
}
