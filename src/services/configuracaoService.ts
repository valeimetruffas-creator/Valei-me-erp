import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getTenantIdRequired } from "./tenantService";
import {
  ColecaoConfiguracao,
  ModuloConfiguracaoKey,
  ValorConfiguracaoModulo,
  obterDefinicaoModulo,
} from "../types/ConfiguracoesSistema";

const COLECOES_CONFIGURACAO: ColecaoConfiguracao[] = ["configuracoes", "entregas", "automacoes"];

function validarColecao(c: ColecaoConfiguracao): void {
  if (!COLECOES_CONFIGURACAO.includes(c)) {
    throw new Error(`Coleção não suportada por configuracaoService: ${c}`);
  }
}

function obterColecaoModulo(chave: ModuloConfiguracaoKey): ColecaoConfiguracao {
  const definicao = obterDefinicaoModulo(chave);
  validarColecao(definicao.colecao);
  return definicao.colecao;
}

export async function carregarConfiguracaoModulo<K extends ModuloConfiguracaoKey>(
  chave: K
): Promise<ValorConfiguracaoModulo<K> | null> {
  const colecao = obterColecaoModulo(chave);
  const empresaId = await getTenantIdRequired();
  const referencia = doc(db, colecao, `${empresaId}__${chave}`);
  const snapshot = await getDoc(referencia);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as ValorConfiguracaoModulo<K>;
}

export async function salvarConfiguracaoModulo<K extends ModuloConfiguracaoKey>(
  chave: K,
  dados: ValorConfiguracaoModulo<K>,
  usuarioId?: string
): Promise<void> {
  const colecao = obterColecaoModulo(chave);
  const empresaId = await getTenantIdRequired();
  const referencia = doc(db, colecao, `${empresaId}__${chave}`);

  await setDoc(
    referencia,
    {
      ...dados,
      atualizadoPor: usuarioId ?? "sistema",
      atualizadoEm: new Date().toISOString(),
      atualizadoServidorEm: serverTimestamp(),
      modulo: chave,
      colecao,
      empresaId,
    },
    { merge: true }
  );
}
