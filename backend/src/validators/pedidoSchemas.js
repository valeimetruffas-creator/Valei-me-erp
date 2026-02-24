import { z } from "zod";
import { statusPedidoSchema } from "./commonSchemas.js";

const itemPedidoSchema = z.object({
  produtoId: z.string().min(2),
  nome: z.string().min(2),
  quantidade: z.coerce.number().int().positive(),
  precoUnitario: z.coerce.number().nonnegative(),
  observacao: z.string().optional(),
});

export const pedidoCreateSchema = z.object({
  cliente: z.object({
    nome: z.string().min(2),
    whatsapp: z.string().min(8),
  }),
  itens: z.array(itemPedidoSchema).min(1),
  formaPagamento: z.enum(["dinheiro", "pix", "cartao"]),
  entrega: z.object({
    tipo: z.enum(["entrega", "retirada"]),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    referencia: z.string().optional(),
  }),
  observacao: z.string().optional(),
  status: statusPedidoSchema.optional(),
  origem: z.enum(["delivery", "ifood"]).optional(),
});

export const pedidoUpdateStatusSchema = z.object({
  status: statusPedidoSchema,
});
