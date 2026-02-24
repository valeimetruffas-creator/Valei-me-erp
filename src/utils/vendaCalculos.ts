import { ItemVendaPadrao } from "../types/Venda";

export function toNumber(valor: unknown): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "string") {
    const texto = valor.trim();
    const normalizado = texto.includes(",")
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

export function formatMoneyBR(valor: unknown): string {
  const numero = toNumber(valor);
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function calcularSubtotalItem(item: Pick<ItemVendaPadrao, "quantidade" | "precoUnitario">): number {
  const quantidade = Math.max(1, toNumber(item.quantidade));
  const precoUnitario = Math.max(0, toNumber(item.precoUnitario));
  return quantidade * precoUnitario;
}

export function normalizarItemVenda(
  item: Omit<ItemVendaPadrao, "subtotal"> & { subtotal?: number }
): ItemVendaPadrao {
  const quantidade = Math.max(1, toNumber(item.quantidade));
  const precoUnitario = Math.max(0, toNumber(item.precoUnitario));

  return {
    ...item,
    quantidade,
    precoUnitario,
    subtotal: quantidade * precoUnitario,
  };
}

export function calcularSubtotalVenda(itens: ItemVendaPadrao[]): number {
  return itens.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
}

export function calcularTotalVenda(
  itens: ItemVendaPadrao[],
  desconto: unknown,
  acrescimo: unknown
): number {
  return calcularSubtotalVenda(itens) - toNumber(desconto) + toNumber(acrescimo);
}
