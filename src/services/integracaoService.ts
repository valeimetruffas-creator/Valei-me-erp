import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getTenantIdRequired } from "./tenantService";
import {
  ModuloConfiguracaoKey,
  ValorConfiguracaoModulo,
  obterDefinicaoModulo,
} from "../types/ConfiguracoesSistema";

function validarModuloIntegracao(chave: ModuloConfiguracaoKey): void {
  const definicao = obterDefinicaoModulo(chave);
  if (definicao.colecao !== "integracoes") {
    throw new Error(`Módulo ${chave} não pertence à coleção de integrações`);
  }
}

export async function carregarIntegracao<K extends ModuloConfiguracaoKey>(
  chave: K
): Promise<ValorConfiguracaoModulo<K> | null> {
  validarModuloIntegracao(chave);
  const empresaId = await getTenantIdRequired();
  const referencia = doc(db, "integracoes", `${empresaId}__${chave}`);
  const snapshot = await getDoc(referencia);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as ValorConfiguracaoModulo<K>;
}

export async function salvarIntegracao<K extends ModuloConfiguracaoKey>(
  chave: K,
  dados: ValorConfiguracaoModulo<K>,
  usuarioId?: string
): Promise<void> {
  validarModuloIntegracao(chave);
  const empresaId = await getTenantIdRequired();
  const referencia = doc(db, "integracoes", `${empresaId}__${chave}`);

  await setDoc(
    referencia,
    {
      ...dados,
      atualizadoPor: usuarioId ?? "sistema",
      atualizadoEm: new Date().toISOString(),
      atualizadoServidorEm: serverTimestamp(),
      modulo: chave,
      colecao: "integracoes",
      statusIntegracao: dados.ativo ? "ativo" : "inativo",
      preparadoParaCloudFunctions: true,
      empresaId,
    },
    { merge: true }
  );
}
