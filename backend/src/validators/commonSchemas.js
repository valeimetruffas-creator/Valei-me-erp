import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(2),
});

export const statusPedidoSchema = z.enum([
  "pendente",
  "confirmado",
  "preparando",
  "saiu_entrega",
  "entregue",
  "cancelado",
]);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  status: z.string().optional(),
});
