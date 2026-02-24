import { z } from "zod";

export const produtoCreateSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().default(""),
  precoVenda: z.coerce.number().positive(),
  categoria: z.string().min(2),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  ativo: z.boolean().default(true),
  fichaTecnicaId: z.string().optional(),
  estoqueUnidades: z.coerce.number().min(0).default(0),
  destaque: z.boolean().default(false),
});

export const produtoUpdateSchema = produtoCreateSchema.partial();
