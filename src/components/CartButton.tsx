import { useNavigate } from "react-router-dom";
import { theme } from "../styles/theme";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../contexts/CartContext";

export default function CartButton() {
  const navigate = useNavigate(); // ← FALTAVA ISSO

  const { cartItems } = useCart();

  // Proteção total contra undefined
  const totalItens = (cartItems ?? []).reduce(
    (total: number, item: any) => total + (item?.quantity ?? 0),
    0
  );

  return (
    <button
      onClick={() => navigate("/carrinho")}
      className="fixed bottom-6 right-6 z-40 font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:opacity-90 transition"
      style={{
        backgroundColor: theme.colors.primaryLight,
        color: theme.colors.primaryDark,
      }}
    >
      <ShoppingCart className="w-6 h-6" />

      {totalItens > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {totalItens}
        </span>
      )}

      Ver Carrinho
    </button>
    
  );
}

