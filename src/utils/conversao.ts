export function paraGramas(qtd: number, unidade: "kg" | "g" | "l" | "ml") {
  if (unidade === "kg" || unidade === "l") return qtd * 1000;
  return qtd;
}
