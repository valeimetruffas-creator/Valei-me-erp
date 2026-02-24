import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

interface ItemVenda {
  produtoId: string;
  quantidade: number;
}

export const registrarVendaSegura = async (
  produtos: ItemVenda[],
  cliente: string,
  desconto: number = 0
) => {
  try {
    const fn = httpsCallable(functions, "registrarVendaSegura");

    const resposta: any = await fn({
      produtos,
      cliente,
      desconto
    });

    return resposta.data;
  } catch (error: any) {
    console.error("Erro na venda segura:", error.message);
    throw new Error(error.message);
  }
};
