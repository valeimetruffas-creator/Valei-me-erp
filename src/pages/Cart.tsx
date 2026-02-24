import React from "react";
import { useCart, CartItem } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { theme } from "../styles/theme";

export default function Cart() {
  const { cart, removeFromCart, clearCart, total } = useCart();
  const navigate = useNavigate();

  return (
    <div className="p-6 pt-20 min-h-screen text-white" style={{ backgroundColor: theme.colors.primary }}>
      <h1 className="text-3xl font-bold mb-4" style={{ color: theme.colors.primaryLight }}>Carrinho</h1>

      {cart.length === 0 ? (
        <p style={{ color: theme.colors.background }}>O carrinho está vazio.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item: CartItem) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-4 rounded"
              style={{ backgroundColor: theme.colors.primaryDark }}
            >
              <div style={{ color: theme.colors.background }}>
                <p className="font-semibold">{item.name}</p>
                <p>
                  R$ {item.price.toFixed(2)} x {item.quantity}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="px-3 py-1 rounded hover:opacity-90 text-white font-medium"
                style={{ backgroundColor: theme.colors.danger }}
              >
                Remover
              </button>
            </div>
          ))}

          <div className="font-bold text-xl pt-4" style={{ color: theme.colors.primaryLight }}>
            Total: R$ {total.toFixed(2)}
          </div>

          <button
            onClick={() => navigate("/finalizar-venda")}
            className="text-white font-bold px-4 py-2 rounded-xl shadow mt-4 hover:opacity-90"
            style={{ backgroundColor: theme.colors.success }}
          >
            Converter em Venda
          </button>

          <div className="flex gap-4 mt-2">
            <button
              onClick={clearCart}
              className="text-white px-4 py-2 rounded hover:opacity-90"
              style={{ backgroundColor: theme.colors.border }}
            >
              Limpar Carrinho
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
