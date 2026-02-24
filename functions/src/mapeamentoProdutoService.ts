import { admin, db } from "./firebase";

type Registro = Record<string, unknown>;

export interface DadosMapeamentoIfood {
  ifoodProductId: string;
  externalCode: string;
  nome: string;
}

export interface ItemNaoMapeadoPayload {
  pedidoId: string;
  itemId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  ifoodProductId?: string;
  externalCode?: string;
}

interface MigracaoParams {
  apply?: boolean;
  incluirPendentes?: boolean;
  limite?: number;
}

interface MigracaoItemResultado {
  naoMapeadoId: string;
  produtoId: string;
  ifoodProductIdAplicado: string;
  externalCodeAplicado: string;
  fonte: "vinculado" | "pendente";
}

export interface MigracaoResultado {
  total: number;
  atualizados: number;
  ignorados: number;
  erros: number;
  logs: string[];
}

function asRegistro(valor: unknown): Registro {
  if (typeof valor !== "object" || valor === null) {
    return {};
  }
  return valor as Registro;
}

function asTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function buscarPorCampo(campo: "ifoodProductId" | "externalCode", valor: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  if (!valor.trim()) {
    return null;
  }

  const snap = await db.collection("produtos").where(campo, "==", valor.trim()).limit(1).get();
  if (snap.empty) {
    return null;
  }

  return snap.docs[0];
}

async function buscarPorNome(nome: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  if (!nome.trim()) {
    return null;
  }

  const porNomeExato = await db.collection("produtos").where("nome", "==", nome.trim()).limit(1).get();
  if (!porNomeExato.empty) {
    return porNomeExato.docs[0];
  }

  const nomeNormalizado = normalizarTexto(nome);
  const todos = await db.collection("produtos").get();

  for (const doc of todos.docs) {
    const dados = asRegistro(doc.data());
    const nomeProduto = asTexto(dados.nome);
    if (normalizarTexto(nomeProduto) === nomeNormalizado) {
      return doc;
    }
  }

  return null;
}

export async function mapearProdutoIfood(dados: DadosMapeamentoIfood): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const ifoodProductId = asTexto(dados.ifoodProductId);
  const externalCode = asTexto(dados.externalCode);
  const nome = asTexto(dados.nome);

  const porIfoodId = await buscarPorCampo("ifoodProductId", ifoodProductId);
  if (porIfoodId) return porIfoodId;

  const porExternalCode = await buscarPorCampo("externalCode", externalCode);
  if (porExternalCode) return porExternalCode;

  const porNome = await buscarPorNome(nome);
  if (porNome) return porNome;

  return null;
}

export async function registrarProdutoNaoMapeado(payload: ItemNaoMapeadoPayload): Promise<string> {
  const docId = `${payload.pedidoId}_${payload.itemId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ref = db.collection("produtosNaoMapeados").doc(docId);

  const snap = await ref.get();
  const tentativasAtuais = snap.exists ? Number(asRegistro(snap.data()).tentativas ?? 0) : 0;

  await ref.set(
    {
      pedidoId: payload.pedidoId,
      itemId: payload.itemId,
      nome: payload.nome,
      quantidade: payload.quantidade,
      precoUnitario: payload.precoUnitario,
      ifoodProductId: payload.ifoodProductId || "",
      externalCode: payload.externalCode || "",
      status: "pendente",
      tentativas: tentativasAtuais + 1,
      atualizadoEm: new Date().toISOString(),
      recebidoEm: snap.exists ? asRegistro(snap.data()).recebidoEm : admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return docId;
}

export async function vincularProdutoNaoMapeado(
  naoMapeadoId: string,
  produtoId: string,
  usuarioId: string
): Promise<{ produtoId: string; naoMapeadoId: string }> {
  if (!naoMapeadoId.trim()) {
    throw new Error("naoMapeadoId é obrigatório");
  }

  if (!produtoId.trim()) {
    throw new Error("produtoId é obrigatório");
  }

  const naoMapeadoRef = db.collection("produtosNaoMapeados").doc(naoMapeadoId);
  const produtoRef = db.collection("produtos").doc(produtoId);

  const [naoMapeadoSnap, produtoSnap] = await Promise.all([naoMapeadoRef.get(), produtoRef.get()]);

  if (!naoMapeadoSnap.exists) {
    throw new Error("Item não mapeado não encontrado");
  }

  if (!produtoSnap.exists) {
    throw new Error("Produto não encontrado");
  }

  const dadosNaoMapeado = asRegistro(naoMapeadoSnap.data());
  const ifoodProductId = asTexto(dadosNaoMapeado.ifoodProductId);
  const externalCode = asTexto(dadosNaoMapeado.externalCode);

  await db.runTransaction(async (tx) => {
    tx.set(
      produtoRef,
      {
        ifoodProductId: ifoodProductId || asTexto(dadosNaoMapeado.itemId),
        externalCode: externalCode || asTexto(dadosNaoMapeado.itemId),
        dataAtualizacao: new Date().toISOString(),
      },
      { merge: true }
    );

    tx.set(
      naoMapeadoRef,
      {
        status: "vinculado",
        produtoIdInterno: produtoId,
        produtoNomeInterno: asTexto(asRegistro(produtoSnap.data()).nome),
        vinculadoEm: new Date().toISOString(),
        vinculadoPor: usuarioId,
        atualizadoEm: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  return {
    produtoId,
    naoMapeadoId,
  };
}

function limitarTexto(valor: string, tamanho: number): string {
  return valor.length > tamanho ? `${valor.slice(0, tamanho)}...` : valor;
}

async function registrarLogMigracao(payload: Registro): Promise<void> {
  await db.collection("logsIntegracao").add({
    tipo: "migracao_ifood",
    ...payload,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    criadoEmIso: new Date().toISOString(),
  });
}

export async function executarMigracaoMapeamentoProdutosIfood(
  params: MigracaoParams = {}
): Promise<MigracaoResultado> {
  const apply = Boolean(params.apply);
  const incluirPendentes = Boolean(params.incluirPendentes);
  const limite = Number.isFinite(params.limite) && (params.limite ?? 0) > 0
    ? Number(params.limite)
    : 1000;

  const snapshot = await db.collection("produtosNaoMapeados").limit(limite).get();

  const logs: string[] = [
    `Migração iniciada. apply=${apply} incluirPendentes=${incluirPendentes} limite=${limite}`,
  ];

  let atualizados = 0;
  let ignorados = 0;
  let erros = 0;
  const itensAtualizados: MigracaoItemResultado[] = [];

  for (const doc of snapshot.docs) {
    try {
      const dados = asRegistro(doc.data());
      const status = asTexto(dados.status);
      const produtoIdInterno = asTexto(dados.produtoIdInterno);
      const ifoodProductId = asTexto(dados.ifoodProductId);
      const externalCode = asTexto(dados.externalCode);
      const itemId = asTexto(dados.itemId);
      const nome = asTexto(dados.nome);

      let produtoIdDestino = "";
      let fonte: "vinculado" | "pendente" = "vinculado";

      if (status === "vinculado" && produtoIdInterno) {
        produtoIdDestino = produtoIdInterno;
      } else if (incluirPendentes && status === "pendente") {
        const mapeado = await mapearProdutoIfood({
          ifoodProductId,
          externalCode,
          nome,
        });

        if (mapeado) {
          produtoIdDestino = mapeado.id;
          fonte = "pendente";
        }
      }

      if (!produtoIdDestino) {
        ignorados += 1;
        logs.push(`[IGNORADO] ${doc.id} sem produto vinculado para migrar`);
        continue;
      }

      const produtoRef = db.collection("produtos").doc(produtoIdDestino);
      const produtoSnap = await produtoRef.get();

      if (!produtoSnap.exists) {
        ignorados += 1;
        logs.push(`[IGNORADO] ${doc.id} produto ${produtoIdDestino} não existe`);
        continue;
      }

      const produtoDados = asRegistro(produtoSnap.data());
      const ifoodAtual = asTexto(produtoDados.ifoodProductId);
      const externalAtual = asTexto(produtoDados.externalCode);

      const ifoodAplicado = ifoodAtual || ifoodProductId || itemId;
      const externalAplicado = externalAtual || externalCode || itemId;

      if (!ifoodAplicado && !externalAplicado) {
        ignorados += 1;
        logs.push(`[IGNORADO] ${doc.id} sem dados ifoodProductId/externalCode`);
        continue;
      }

      if (apply) {
        await db.runTransaction(async (tx) => {
          tx.set(
            produtoRef,
            {
              ifoodProductId: ifoodAtual || ifoodAplicado,
              externalCode: externalAtual || externalAplicado,
              dataAtualizacao: new Date().toISOString(),
            },
            { merge: true }
          );

          tx.set(
            doc.ref,
            {
              status: "vinculado",
              produtoIdInterno: produtoIdDestino,
              atualizadoEm: new Date().toISOString(),
              migradoEm: new Date().toISOString(),
              migracaoAutomatica: true,
            },
            { merge: true }
          );
        });
      }

      atualizados += 1;
      itensAtualizados.push({
        naoMapeadoId: doc.id,
        produtoId: produtoIdDestino,
        ifoodProductIdAplicado: ifoodAplicado,
        externalCodeAplicado: externalAplicado,
        fonte,
      });
      logs.push(`[ATUALIZADO] ${doc.id} -> produto ${produtoIdDestino} (fonte=${fonte})`);
    } catch (error) {
      erros += 1;
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido na migração";
      logs.push(`[ERRO] ${doc.id} -> ${limitarTexto(mensagem, 180)}`);
    }
  }

  await registrarLogMigracao({
    total: snapshot.size,
    atualizados,
    ignorados,
    erros,
    apply,
    incluirPendentes,
    limite,
    logs: logs.slice(0, 300),
    itensAtualizados: itensAtualizados.slice(0, 300),
  });

  return {
    total: snapshot.size,
    atualizados,
    ignorados,
    erros,
    logs,
  };
}
