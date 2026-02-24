import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db } from "./firebase";

export type TenantContext = {
  uid: string;
  empresaId: string;
  role: string;
  nome?: string;
};

let cached: TenantContext | null = null;

function normalizarRole(role: unknown): string {
  if (typeof role !== "string") {
    return "funcionario";
  }

  const valor = role.trim().toLowerCase();
  if (!valor) {
    return "funcionario";
  }

  if (["admin", "administrador"].includes(valor)) {
    return "admin";
  }

  return valor;
}

function toTenantContext(user: User, dados: Record<string, unknown>): TenantContext | null {
  const empresaId = typeof dados.empresaId === "string" ? dados.empresaId.trim() : "";
  if (!empresaId) {
    return null;
  }

  return {
    uid: user.uid,
    empresaId,
    role: normalizarRole(dados.role),
    nome: typeof dados.nome === "string" ? dados.nome : undefined,
  };
}

export function getPublicEmpresaId(): string {
  const raw = import.meta.env.VITE_DEFAULT_EMPRESA_ID;
  return typeof raw === "string" ? raw.trim() : "";
}

export async function getTenantContext(forceRefresh = false): Promise<TenantContext | null> {
  const user = auth.currentUser;
  if (!user) {
    cached = null;
    return null;
  }

  if (!forceRefresh && cached?.uid === user.uid) {
    return cached;
  }

  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  const ctx = toTenantContext(user, snap.data() as Record<string, unknown>);
  cached = ctx;
  return ctx;
}

export async function getTenantIdRequired(): Promise<string> {
  const ctx = await getTenantContext();
  if (!ctx?.empresaId) {
    throw new Error("Tenant não identificado para o usuário autenticado.");
  }

  return ctx.empresaId;
}

export function clearTenantCache(): void {
  cached = null;
}

export function isAdminRole(role?: string): boolean {
  return role === "admin";
}
