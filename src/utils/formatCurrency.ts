// utils/formatCurrency.ts

// Formata valor para BRL (Real Brasileiro)
export function formatCurrencyBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

// Formata valor para formato genérico
export function formatCurrency(valor: number, locale: string = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
