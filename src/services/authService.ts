import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebase";
import { clearTenantCache } from "./tenantService";

export type CriarContaInput = {
  email: string;
  senha: string;
  nomeUsuario: string;
  nomeEmpresa: string;
};

function normalizarTexto(valor: string): string {
  return valor.trim().replace(/\s+/g, " ");
}

function gerarEmpresaId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return `emp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toAuthError(error: unknown): FirebaseError | null {
  return error instanceof FirebaseError ? error : null;
}

export async function loginComEmailSenha(email: string, senha: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), senha);
  clearTenantCache();
  return cred;
}

export async function logoutUsuario(): Promise<void> {
  await signOut(auth);
  clearTenantCache();
}

export async function recuperarSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function criarContaComEmpresa(input: CriarContaInput): Promise<{ empresaId: string; uid: string }> {
  const email = input.email.trim();
  const senha = input.senha;
  const nomeUsuario = normalizarTexto(input.nomeUsuario);
  const nomeEmpresa = normalizarTexto(input.nomeEmpresa);

  if (!nomeUsuario || !nomeEmpresa) {
    throw new Error("Nome do usuário e nome da empresa são obrigatórios.");
  }

  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  const { user } = cred;
  const empresaId = gerarEmpresaId();

  try {
    await updateProfile(user, { displayName: nomeUsuario });

    const batch = writeBatch(db);

    const empresaRef = doc(db, "empresas", empresaId);
    batch.set(empresaRef, {
      id: empresaId,
      nome: nomeEmpresa,
      ownerUid: user.uid,
      ativo: true,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      plano: "starter",
      taxaEntregaPadrao: 0,
    });

    const usuarioRef = doc(db, "usuarios", user.uid);
    batch.set(usuarioRef, {
      uid: user.uid,
      email: user.email,
      nome: nomeUsuario,
      role: "admin",
      empresaId,
      ativo: true,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    }, { merge: true });

    const estoqueRef = doc(db, "estoque", empresaId);
    batch.set(estoqueRef, {
      empresaId,
      insumos: [],
      embalagens: [],
      atualizadoEm: serverTimestamp(),
    }, { merge: true });

    const produtosRef = doc(db, "produtos", empresaId);
    batch.set(produtosRef, {
      empresaId,
      itens: [],
      atualizadoEm: serverTimestamp(),
    }, { merge: true });

    const pedidosRef = doc(db, "pedidos", empresaId);
    batch.set(pedidosRef, {
      empresaId,
      itens: [],
      atualizadoEm: serverTimestamp(),
    }, { merge: true });

    await batch.commit();
    clearTenantCache();

    console.log("[Auth] Conta criada e tenant provisionado", { uid: user.uid, empresaId });
    return { empresaId, uid: user.uid };
  } catch (error) {
    const firebaseError = toAuthError(error);
    console.error("[Auth] Erro ao provisionar tenant", firebaseError?.code ?? "auth/provision-failed", firebaseError?.message ?? error);

    await setDoc(doc(db, "usuarios", user.uid), {
      uid: user.uid,
      email: user.email,
      nome: nomeUsuario,
      role: "admin",
      empresaId,
      ativo: true,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    }, { merge: true });

    throw error;
  }
}
