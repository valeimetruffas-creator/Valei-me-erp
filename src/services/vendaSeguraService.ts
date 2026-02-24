import { registrarVendaSegura as cloudFunctionRegistrarVenda } from "./backendService";

interface ItemVenda {
  produtoId: string;
  quantidade: number;
}

/**
 * Registra venda segura via Cloud Function
 * @param produtos Lista de produtos na venda
 * @param cliente Nome do cliente (padrão: PDV Balcão)
 * @param desconto Desconto aplicado (padrão: 0)
 */
export async function registrarVendaSegura(
  produtos: ItemVenda[],
  cliente: string = "PDV Balcão",
  desconto: number = 0
) {
  const resposta: any = await cloudFunctionRegistrarVenda({
    produtos,
    cliente,
    desconto
  });

  return resposta.data;
}
