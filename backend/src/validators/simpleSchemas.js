import { z } from "zod";

export const estoqueCreateSchema = z.object({
  tipo: z.enum(["insumo", "embalagem"]),
  nome: z.string().min(2),
  quantidade: z.coerce.number().min(0),
  unidade: z.string().min(1),
  estoqueMinimo: z.coerce.number().min(0).default(0),
  categoria: z.string().optional(),
  observacao: z.string().optional(),
});

export const estoqueUpdateSchema = estoqueCreateSchema.partial();

export const clienteCreateSchema = z.object({
  nome: z.string().min(2),
  whatsapp: z.string().min(8),
  email: z.string().email().optional(),
  endereco: z.object({
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    referencia: z.string().optional(),
  }).optional(),
  observacao: z.string().optional(),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();

export const configuracaoCreateSchema = z.object({
  nomeEmpresa: z.string().min(2),
  logo: z.string().url().optional().or(z.literal("")),
  cores: z.object({
    primaria: z.string().optional(),
    secundaria: z.string().optional(),
  }).optional(),
  taxaEntrega: z.coerce.number().min(0),
  whatsapp: z.string().min(8).optional(),
  horarioFuncionamento: z.string().optional(),
});

export const configuracaoUpdateSchema = configuracaoCreateSchema.partial();
