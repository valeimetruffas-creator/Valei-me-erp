/** Uso de base ou insumo no recheio */
export interface ComponenteRecheio {
  tipo: "BASE" | "INSUMO";
  itemId: string;
  nome: string;
  quantidade: number; // g, ml ou un
  unidade: string;
  custoTotal: number;
}

/** Recheio */
export interface Recheio {
  id: string;
  nome: string;
  rendimento: number; // em gramas
  componentes: ComponenteRecheio[];
}

const STORAGE_KEY = "valeime-recheios";

/** Listar recheios */
export function listarRecheios(): Recheio[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

/** Salvar ou atualizar recheio */
export function salvarRecheio(recheio: Recheio) {
  const lista = listarRecheios();
  const index = lista.findIndex(r => r.id === recheio.id);

  if (index >= 0) {
    lista[index] = recheio;
  } else {
    lista.push(recheio);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

/** Excluir recheio */
export function excluirRecheio(id: string) {
  const lista = listarRecheios().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

/** Calcular custo total do recheio */
export function calcularCustoRecheio(recheio: Recheio): number {
  return recheio.componentes.reduce(
    (total, c) => total + (c.custoTotal || 0),
    0
  );
}

/** Custo por grama */
export function calcularCustoPorGramaRecheio(recheio: Recheio): number {
  const custo = calcularCustoRecheio(recheio);
  return recheio.rendimento > 0 ? custo / recheio.rendimento : 0;
}
