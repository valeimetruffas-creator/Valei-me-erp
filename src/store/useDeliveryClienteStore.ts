import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ItemCarrinhoDelivery } from "../types/DeliveryCliente";

type DeliveryClienteState = {
  itensCarrinho: ItemCarrinhoDelivery[];
  observacaoGeral: string;
  adicionarItem: (item: ItemCarrinhoDelivery) => void;
  atualizarQuantidade: (produtoId: string, quantidade: number) => void;
  removerItem: (produtoId: string) => void;
  limparCarrinho: () => void;
  definirObservacaoGeral: (observacao: string) => void;
  repetirPedido: (itens: ItemCarrinhoDelivery[]) => void;
  totalCarrinho: () => number;
};

export const useDeliveryClienteStore = create<DeliveryClienteState>()(
  persist(
    (set, get) => ({
      itensCarrinho: [],
      observacaoGeral: "",

      adicionarItem: (item) => {
        const itens = [...get().itensCarrinho];
        const idx = itens.findIndex(
          (i) => i.produtoId === item.produtoId && i.observacao.trim() === item.observacao.trim()
        );

        if (idx >= 0) {
          itens[idx] = {
            ...itens[idx],
            quantidade: itens[idx].quantidade + item.quantidade,
          };
        } else {
          itens.push(item);
        }

        set({ itensCarrinho: itens });
      },

      atualizarQuantidade: (produtoId, quantidade) => {
        if (quantidade <= 0) {
          set({ itensCarrinho: get().itensCarrinho.filter((item) => item.produtoId !== produtoId) });
          return;
        }

        set({
          itensCarrinho: get().itensCarrinho.map((item) =>
            item.produtoId === produtoId ? { ...item, quantidade } : item
          ),
        });
      },

      removerItem: (produtoId) => {
        set({
          itensCarrinho: get().itensCarrinho.filter((item) => item.produtoId !== produtoId),
        });
      },

      limparCarrinho: () => {
        set({ itensCarrinho: [], observacaoGeral: "" });
      },

      definirObservacaoGeral: (observacao) => {
        set({ observacaoGeral: observacao });
      },

      repetirPedido: (itens) => {
        set({ itensCarrinho: itens, observacaoGeral: "" });
      },

      totalCarrinho: () => {
        return get().itensCarrinho.reduce((total, item) => total + item.precoUnitario * item.quantidade, 0);
      },
    }),
    { name: "delivery-cliente-carrinho" }
  )
);
