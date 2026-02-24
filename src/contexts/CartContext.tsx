import React, { createContext, useContext, useState, ReactNode } from "react";

// Tipos
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
};

interface CartContextValue {
  cart: CartItem[];
  cartItems: CartItem[]; // Alias para compatibilidade
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
}

// Criação do contexto
const CartContext = createContext<CartContextValue | undefined>(undefined);

// Provider
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value: CartContextValue = {
    cart,
    cartItems: cart, // Alias para compatibilidade
    addToCart,
    removeFromCart,
    clearCart,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook para usar o contexto
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};