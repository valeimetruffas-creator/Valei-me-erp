import {
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { vincularProdutoNaoMapeadoIfood } from "./backendService";
import { ProdutoNaoMapeado } from "../types/ProdutoNaoMapeado";
import { getTenantContext } from "./tenantService";

type Registro = Record<string, unknown>;

function asRegistro(valor: unknown): Registro {
  if (typeof valor !== "object" || valor === null) {
    return {};
  }
  return valor as Registro;
}

function asTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function asNumero(valor: unknown): number {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }
  if (typeof valor === "string") {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : 0;
  }
  return 0;
}

function asIso(valor: unknown): string | undefined {
  if (typeof valor === "string" && valor.trim()) {
    return valor;
  }

  if (valor instanceof Timestamp) {
    return valor.toDate().toISOString();
  }

  if (typeof valor === "object" && valor !== null) {
    const registro = valor as { seconds?: number };
    if (typeof registro.seconds === "number") {
      return new Date(registro.seconds * 1000).toISOString();
    }
  }

  return undefined;
}

function toProdutoNaoMapeado(id: string, valor: unknown): ProdutoNaoMapeado {
  const dados = asRegistro(valor);
  const status = asTexto(dados.status) === "vinculado" ? "vinculado" : "pendente";

  return {
    id,
    pedidoId: asTexto(dados.pedidoId),
    itemId: asTexto(dados.itemId),
    nome: asTexto(dados.nome),
    quantidade: asNumero(dados.quantidade),
    precoUnitario: asNumero(dados.precoUnitario),
    ifoodProductId: asTexto(dados.ifoodProductId),
    externalCode: asTexto(dados.externalCode),
    status,
    tentativas: asNumero(dados.tentativas),
    recebidoEm: asIso(dados.recebidoEm),
    atualizadoEm: asIso(dados.atualizadoEm),
    produtoIdInterno: asTexto(dados.produtoIdInterno),
    produtoNomeInterno: asTexto(dados.produtoNomeInterno),
  };
}

export function observarProdutosNaoMapeados(
  callback: (itens: ProdutoNaoMapeado[]) => void
): () => void {
  let ativo = true;
  let timer: number | null = null;

  const carregar = async () => {
    try {
      const tenant = await getTenantContext();
      const baseRef = collection(db, "produtosNaoMapeados");
      const referencia = tenant?.empresaId
        ? query(baseRef, where("empresaId", "==", tenant.empresaId), where("status", "==", "pendente"))
        : query(baseRef, where("status", "==", "pendente"));

      const snapshot = await getDocs(referencia);
      if (!ativo) {
        return;
      }

      const itens = snapshot.docs
        .map((doc) => toProdutoNaoMapeado(doc.id, doc.data()))
        .filter((item) => item.status === "pendente")
        .sort((a, b) => {
          const dataA = new Date(a.recebidoEm ?? a.atualizadoEm ?? 0).getTime();
          const dataB = new Date(b.recebidoEm ?? b.atualizadoEm ?? 0).getTime();
          return dataB - dataA;
        });

      callback(itens);
    } catch (error) {
      console.error("[Mapeamento] Falha ao carregar produtos não mapeados", error);
      if (ativo) {
        callback([]);
      }
    }
  };

  void carregar();
  timer = window.setInterval(() => {
    void carregar();
  }, 15000);

  return () => {
    ativo = false;
    if (timer !== null) {
      window.clearInterval(timer);
    }
  };
}

export async function vincularItemNaoMapeado(naoMapeadoId: string, produtoId: string): Promise<void> {
  await vincularProdutoNaoMapeadoIfood({
    naoMapeadoId,
    produtoId,
  });
}
