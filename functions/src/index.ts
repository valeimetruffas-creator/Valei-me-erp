import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import {
  autenticarIfood as autenticarIfoodService,
  enviarCardapio as enviarCardapioService,
  atualizarProduto as atualizarProdutoService,
  receberPedidosWebhook,
  aceitarPedidoIfood as aceitarPedidoIfoodService,
  rejeitarPedidoIfood as rejeitarPedidoIfoodService,
  atualizarStatusPedidoIfood as atualizarStatusPedidoIfoodService,
  sincronizarTodosProdutosComIfood,
} from "./ifoodService";
import {
  vincularProdutoNaoMapeado as vincularProdutoNaoMapeadoService,
  executarMigracaoMapeamentoProdutosIfood,
} from "./mapeamentoProdutoService";
import { admin, db } from "./firebase";

type ItemVenda = {
  produtoId: string;
  quantidade: number;
};

type ItemCompra = {
  insumoId: string;
  quantidadeGramas: number;
  custoTotal: number;
  custoUnitario: number;
  unidade: "grama" | "unidade";
};

type CompraPayload = {
  id: string;
  fornecedor: string;
  data: string;
  tipoDocumento?: "nfe" | "nfce" | "manual";
  numeroNota?: string;
  dataEmissao?: string;
  itens: ItemCompra[];
};

type CancelarCompraPayload = {
  compraId: string;
};

type EditarCompraPayload = {
  compraId: string;
  compra: CompraPayload;
};

type ReceitaProduto = {
  insumoId: string;
  quantidadeGramas: number;
};

type ProducaoPayload = {
  id: string;
  produtoId: string;
  quantidadeProduzida: number;
  data: string;
};

type ItemPedidoDeliveryEntrada = {
  produtoId: string;
  quantidade: number;
  observacao?: string;
};

type CheckoutDeliveryPayload = {
  cliente: {
    nome: string;
    whatsapp: string;
  };
  endereco: {
    tipo: "entrega" | "retirada";
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    referencia?: string;
    cep?: string;
  };
  pagamento: {
    tipo: "dinheiro" | "pix" | "cartao";
    trocoPara?: number;
  };
  observacao?: string;
  itens: ItemPedidoDeliveryEntrada[];
};

type StatusPedidoOperacional = "pendente" | "aceito" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";

type ItemPedidoInterno = {
  produtoId: string;
  quantidade: number;
  nome: string;
};

type PedidoInterno = {
  id: string;
  origem: "ifood" | "delivery";
  status: StatusPedidoOperacional;
  estoqueBaixado: boolean;
  itens: ItemPedidoInterno[];
};

type OrigemReceita = "pdv" | "delivery" | "ifood";

async function getRole(uid: string): Promise<string | null> {
  const userSnap = await db.collection("usuarios").doc(uid).get();
  if (!userSnap.exists) return null;
  const data = userSnap.data() as { role?: string } | undefined;
  return data?.role ?? null;
}

async function assertAdmin(uid: string): Promise<void> {
  const role = await getRole(uid);
  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Apenas admin pode executar esta operação");
  }
}

async function assertRole(uid: string, roles: Array<"admin" | "atendente" | "cozinha">, mensagem: string): Promise<void> {
  const role = await getRole(uid);
  if (!role || !roles.includes(role as "admin" | "atendente" | "cozinha")) {
    throw new HttpsError("permission-denied", mensagem);
  }
}

function calcularSaldo(transacoes: Array<{ tipo: string; valor: number }>): number {
  return transacoes.reduce((acc, tx) => {
    if (tx.tipo === "entrada") return acc + Number(tx.valor || 0);
    return acc - Number(tx.valor || 0);
  }, 0);
}

async function registrarLogIntegracao(
  tipo: string,
  dados: Record<string, unknown>,
  sucesso: boolean,
  usuarioId?: string,
): Promise<void> {
  await db.collection("logsIntegracao").add({
    tipo,
    sucesso,
    usuarioId: usuarioId ?? null,
    dados,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    timestamp: new Date().toISOString(),
  });
}

async function registrarLogSistema(
  evento: string,
  dados: Record<string, unknown>,
  usuarioId?: string,
): Promise<void> {
  await db.collection("logsSistema").add({
    evento,
    usuarioId: usuarioId ?? null,
    dados,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    criadoEmIso: new Date().toISOString(),
  });
}

function normalizarItensPedido(dados: Record<string, unknown>): ItemPedidoInterno[] {
  const itensRaw = Array.isArray(dados.itens) ? dados.itens : [];

  return itensRaw
    .map((item): ItemPedidoInterno | null => {
      const registro = asRecord(item);
      const produtoId = asString(registro.produtoId) || asString(registro.id);
      const quantidade = asNumber(registro.quantidade);
      const nome = asString(registro.nome) || "Produto";

      if (!produtoId || !Number.isFinite(quantidade) || quantidade <= 0) {
        return null;
      }

      return {
        produtoId,
        quantidade,
        nome,
      };
    })
    .filter((item): item is ItemPedidoInterno => item !== null);
}

function normalizarStatusPedido(valor: unknown): StatusPedidoOperacional {
  const status = asString(valor).toLowerCase();
  if (
    status === "pendente" ||
    status === "aceito" ||
    status === "preparando" ||
    status === "saiu_entrega" ||
    status === "entregue" ||
    status === "cancelado"
  ) {
    return status;
  }
  return "pendente";
}

function normalizarPedido(snapshot: FirebaseFirestore.DocumentSnapshot): PedidoInterno {
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "Pedido não encontrado");
  }

  const dados = asRecord(snapshot.data());
  const origemRaw = asString(dados.origem).toLowerCase();
  const origem: "ifood" | "delivery" = origemRaw === "ifood" ? "ifood" : "delivery";
  const itens = normalizarItensPedido(dados);

  if (itens.length === 0) {
    throw new HttpsError("failed-precondition", "Pedido sem itens válidos");
  }

  return {
    id: snapshot.id,
    origem,
    status: normalizarStatusPedido(dados.status),
    estoqueBaixado: Boolean(dados.estoqueBaixado),
    itens,
  };
}

function validarStatusEntrada(status: string): StatusPedidoOperacional {
  const normalizado = status.trim().toLowerCase();
  if (
    normalizado !== "aceito" &&
    normalizado !== "preparando" &&
    normalizado !== "saiu_entrega" &&
    normalizado !== "entregue" &&
    normalizado !== "cancelado"
  ) {
    throw new HttpsError("invalid-argument", "Status inválido");
  }
  return normalizado;
}

function normalizarOrigemReceita(origem: unknown): OrigemReceita {
  const texto = asString(origem).toLowerCase();
  if (texto === "delivery" || texto === "ifood") {
    return texto;
  }
  return "pdv";
}

function criarTransacaoVenda(
  vendaId: string,
  origem: OrigemReceita,
  total: number,
  dataIso: string,
  cliente: string,
  pedidoId?: string,
): Record<string, unknown> {
  return {
    id: `venda_${vendaId}`,
    tipo: "entrada",
    categoria: "vendas",
    origem,
    valor: total,
    data: dataIso,
    idVenda: vendaId,
    pedidoId: pedidoId ?? null,
    descricao: `Venda ${origem.toUpperCase()} - ${cliente || "Cliente"}`,
  };
}

async function sincronizarVendaEFinanceiroPorPedido(
  pedidoId: string,
  status: StatusPedidoOperacional,
  usuarioId: string,
): Promise<void> {
  const vendasSnap = await db.collection("vendas").where("pedidoId", "==", pedidoId).limit(1).get();
  if (vendasSnap.empty) {
    return;
  }

  const vendaRef = vendasSnap.docs[0].ref;

  await db.runTransaction(async (t) => {
    const vendaSnap = await t.get(vendaRef);
    if (!vendaSnap.exists) {
      return;
    }

    const vendaData = asRecord(vendaSnap.data());
    const financeiroRef = db.collection("financeiro").doc("dados");
    const financeiroSnap = await t.get(financeiroRef);

    const financeiroData = financeiroSnap.exists ? financeiroSnap.data() ?? {} : {};
    const transacoes = Array.isArray(financeiroData.transacoes) ? [...financeiroData.transacoes] : [];

    const vendaId = vendaSnap.id;
    const transacaoId = `venda_${vendaId}`;
    const origem = normalizarOrigemReceita(vendaData.origem);
    const total = Number(vendaData.total ?? 0);
    const cliente = asString(vendaData.cliente) || "Cliente";
    const dataIso = asString(vendaData.data) || new Date().toISOString();
    const financeiroRegistrado = Boolean(vendaData.financeiroRegistrado);

    let transacoesAtualizadas = transacoes;
    let novoFinanceiroRegistrado = financeiroRegistrado;

    if (status === "entregue" && !financeiroRegistrado) {
      transacoesAtualizadas = [
        ...transacoes,
        criarTransacaoVenda(vendaId, origem, total, dataIso, cliente, pedidoId),
      ];
      novoFinanceiroRegistrado = true;
    }

    if (status === "cancelado" && financeiroRegistrado) {
      transacoesAtualizadas = transacoes.filter((tx) => {
        const registro = tx as { id?: string };
        return registro.id !== transacaoId;
      });
      novoFinanceiroRegistrado = false;
    }

    const statusVenda = status === "entregue"
      ? "confirmada"
      : status === "cancelado"
        ? "cancelada"
        : status;

    t.set(
      vendaRef,
      {
        status: statusVenda,
        origem,
        financeiroRegistrado: novoFinanceiroRegistrado,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: usuarioId,
      },
      { merge: true },
    );

    t.set(
      financeiroRef,
      {
        transacoes: transacoesAtualizadas,
        saldo: calcularSaldo(transacoesAtualizadas as Array<{ tipo: string; valor: number }>),
        lastUpdate: new Date().toISOString(),
      },
      { merge: true },
    );
  });
}

async function baixarEstoquePedido(pedidoId: string, usuarioId: string): Promise<{ estoqueBaixado: boolean; totalItens: number }> {
  const resultado = await db.runTransaction(async (t) => {
    const pedidoRef = db.collection("pedidos").doc(pedidoId);
    const pedidoSnap = await t.get(pedidoRef);
    const pedido = normalizarPedido(pedidoSnap);

    if (pedido.estoqueBaixado) {
      return { estoqueBaixado: true, totalItens: pedido.itens.length };
    }

    for (const item of pedido.itens) {
      const produtoRef = db.collection("produtos").doc(item.produtoId);
      const produtoSnap = await t.get(produtoRef);

      if (!produtoSnap.exists) {
        throw new HttpsError("not-found", `Produto ${item.produtoId} não encontrado`);
      }

      const produto = produtoSnap.data() as {
        nome?: string;
        estoqueUnidades?: number;
      };

      const estoqueAtual = Number(produto.estoqueUnidades ?? 0);
      if (estoqueAtual < item.quantidade) {
        throw new HttpsError("failed-precondition", `Estoque insuficiente para ${produto.nome ?? "produto"}`);
      }

      t.update(produtoRef, {
        estoqueUnidades: estoqueAtual - item.quantidade,
        dataAtualizacao: new Date().toISOString(),
      });
    }

    t.set(
      pedidoRef,
      {
        estoqueBaixado: true,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: usuarioId,
      },
      { merge: true },
    );

    return { estoqueBaixado: true, totalItens: pedido.itens.length };
  });

  await registrarLogSistema(
    "alteracao_estoque",
    {
      tipo: "baixa",
      pedidoId,
      quantidadeItens: resultado.totalItens,
    },
    usuarioId,
  );

  return resultado;
}

async function restaurarEstoquePedidoCancelamento(
  pedidoId: string,
  usuarioId: string,
): Promise<{ estoqueBaixado: boolean; totalItens: number }> {
  const resultado = await db.runTransaction(async (t) => {
    const pedidoRef = db.collection("pedidos").doc(pedidoId);
    const pedidoSnap = await t.get(pedidoRef);
    const pedido = normalizarPedido(pedidoSnap);

    if (!pedido.estoqueBaixado) {
      return { estoqueBaixado: false, totalItens: pedido.itens.length };
    }

    for (const item of pedido.itens) {
      const produtoRef = db.collection("produtos").doc(item.produtoId);
      const produtoSnap = await t.get(produtoRef);

      if (!produtoSnap.exists) {
        throw new HttpsError("not-found", `Produto ${item.produtoId} não encontrado`);
      }

      const produto = produtoSnap.data() as {
        estoqueUnidades?: number;
      };

      const estoqueAtual = Number(produto.estoqueUnidades ?? 0);
      t.update(produtoRef, {
        estoqueUnidades: estoqueAtual + item.quantidade,
        dataAtualizacao: new Date().toISOString(),
      });
    }

    t.set(
      pedidoRef,
      {
        estoqueBaixado: false,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: usuarioId,
      },
      { merge: true },
    );

    return { estoqueBaixado: false, totalItens: pedido.itens.length };
  });

  await registrarLogSistema(
    "alteracao_estoque",
    {
      tipo: "estorno",
      pedidoId,
      quantidadeItens: resultado.totalItens,
    },
    usuarioId,
  );

  return resultado;
}

async function atualizarFilaCozinhaPorPedido(
  pedidoId: string,
  status: StatusPedidoOperacional,
  usuarioId: string,
): Promise<void> {
  const pedidoSnap = await db.collection("pedidos").doc(pedidoId).get();
  if (!pedidoSnap.exists) {
    return;
  }

  const dados = asRecord(pedidoSnap.data());
  const itens = normalizarItensPedido(dados).map((item) => ({
    produtoId: item.produtoId,
    nome: item.nome,
    quantidade: item.quantidade,
  }));

  const origemRaw = asString(dados.origem).toLowerCase();
  const origem: "ifood" | "delivery" = origemRaw === "delivery" ? "delivery" : "ifood";

  await db.collection("filaCozinha").doc(pedidoId).set(
    {
      pedidoId,
      cliente: asString(dados.cliente) || "Cliente",
      itens,
      valor: asNumber(dados.valor ?? dados.total),
      origem,
      status,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: usuarioId,
      enviadoEm: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export const registrarVendaSegura = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const produtos = (data?.produtos ?? []) as ItemVenda[];
  const cliente = typeof data?.cliente === "string" && data.cliente.trim() ? data.cliente.trim() : "Cliente";
  const desconto = Number(data?.desconto ?? 0);

  if (!Array.isArray(produtos) || produtos.length === 0) {
    throw new HttpsError("invalid-argument", "Produtos inválidos");
  }

  if (!Number.isFinite(desconto) || desconto < 0) {
    throw new HttpsError("invalid-argument", "Desconto inválido");
  }

  try {
    const resultado = await db.runTransaction(async (t) => {
      let total = 0;

      for (const item of produtos) {
        if (!item?.produtoId || !Number.isFinite(item.quantidade) || item.quantidade <= 0) {
          throw new HttpsError("invalid-argument", "Item de venda inválido");
        }

        const ref = db.collection("produtos").doc(item.produtoId);
        const snap = await t.get(ref);

        if (!snap.exists) {
          throw new HttpsError("not-found", `Produto ${item.produtoId} não existe`);
        }

        const produto = snap.data() as {
          nome?: string;
          preco?: number;
          precoVenda?: number;
          estoqueUnidades?: number;
        };

        const estoqueAtual = Number(produto.estoqueUnidades ?? 0);
        const precoUnitario = Number(produto.precoVenda ?? produto.preco ?? 0);

        if (estoqueAtual < item.quantidade) {
          throw new HttpsError("failed-precondition", `Estoque insuficiente para ${produto.nome ?? "produto"}`);
        }

        if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) {
          throw new HttpsError("failed-precondition", `Preço inválido para ${produto.nome ?? "produto"}`);
        }

        total += precoUnitario * item.quantidade;

        t.update(ref, {
          estoqueUnidades: estoqueAtual - item.quantidade,
          dataAtualizacao: new Date().toISOString(),
        });
      }

      const totalFinal = Math.max(0, total - desconto);

      const vendaRef = db.collection("vendas").doc();
      const financeiroRef = db.collection("financeiro").doc("dados");
      const financeiroSnap = await t.get(financeiroRef);
      const financeiroData = financeiroSnap.exists ? financeiroSnap.data() ?? {} : {};
      const transacoes = Array.isArray(financeiroData.transacoes) ? [...financeiroData.transacoes] : [];

      t.set(vendaRef, {
        id: vendaRef.id,
        produtos,
        cliente,
        total: totalFinal,
        subtotal: total,
        desconto,
        origem: "pdv",
        userId: auth.uid,
        status: "confirmada",
        financeiroRegistrado: true,
        data: new Date().toISOString(),
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });

      const transacoesAtualizadas = [
        ...transacoes,
        criarTransacaoVenda(
          vendaRef.id,
          "pdv",
          totalFinal,
          new Date().toISOString(),
          cliente,
        ),
      ];

      t.set(
        financeiroRef,
        {
          transacoes: transacoesAtualizadas,
          saldo: calcularSaldo(transacoesAtualizadas as Array<{ tipo: string; valor: number }>),
          lastUpdate: new Date().toISOString(),
        },
        { merge: true },
      );

      return { sucesso: true, vendaId: vendaRef.id, total: totalFinal };
    });

    await registrarLogIntegracao(
      "registrar_venda_segura",
      { totalItens: produtos.length, cliente, desconto },
      true,
      auth.uid,
    );

    return resultado;
  } catch (error) {
    await registrarLogIntegracao(
      "registrar_venda_segura",
      {
        totalItens: Array.isArray(produtos) ? produtos.length : 0,
        erro: error instanceof Error ? error.message : "erro desconhecido",
      },
      false,
      auth.uid,
    );
    throw error;
  }
});

export const registrarCompraSegura = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(auth.uid);

  const compra = data?.compra as CompraPayload | undefined;
  if (!compra?.id || !Array.isArray(compra.itens) || compra.itens.length === 0) {
    throw new HttpsError("invalid-argument", "Compra inválida");
  }

  return db.runTransaction(async (t) => {
    const confeitariaRef = db.collection("confeitaria").doc("dados");
    const financeiroRef = db.collection("financeiro").doc("dados");

    const confeitariaSnap = await t.get(confeitariaRef);
    const financeiroSnap = await t.get(financeiroRef);

    const confeitariaData = confeitariaSnap.exists ? confeitariaSnap.data() ?? {} : {};
    const financeiroData = financeiroSnap.exists ? financeiroSnap.data() ?? {} : {};

    const estoqueAtual = (confeitariaData.estoque ?? {}) as Record<string, number>;
    const comprasAtual = Array.isArray(confeitariaData.compras) ? [...confeitariaData.compras] : [];
    const insumos = Array.isArray(confeitariaData.insumos) ? confeitariaData.insumos : [];

    for (const item of compra.itens) {
      if (!item?.insumoId || !Number.isFinite(item.quantidadeGramas) || item.quantidadeGramas <= 0) {
        throw new HttpsError("invalid-argument", "Item de compra inválido");
      }

      const existeInsumo = insumos.some((insumo: { id?: string }) => insumo.id === item.insumoId);
      if (!existeInsumo) {
        throw new HttpsError("not-found", `Insumo ${item.insumoId} não encontrado`);
      }

      estoqueAtual[item.insumoId] = Number(estoqueAtual[item.insumoId] ?? 0) + Number(item.quantidadeGramas);
    }

    const compraConfirmada = {
      ...compra,
      status: "confirmada",
      confirmado: true,
      dataConfirmacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };

    const totalCompra = compra.itens.reduce((sum, item) => sum + Number(item.custoTotal ?? 0), 0);

    const transacoes = Array.isArray(financeiroData.transacoes) ? [...financeiroData.transacoes] : [];
    transacoes.push({
      id: `compra_${compra.id}`,
      tipo: "despesa",
      categoria: "compras",
      valor: totalCompra,
      fornecedor: compra.fornecedor,
      data: compra.data,
      idCompra: compra.id,
      descricao: `Compra - ${compra.fornecedor}`,
    });

    t.set(confeitariaRef, {
      estoque: estoqueAtual,
      compras: [...comprasAtual, compraConfirmada],
      lastUpdate: new Date().toISOString(),
    }, { merge: true });

    t.set(financeiroRef, {
      transacoes,
      saldo: calcularSaldo(transacoes as Array<{ tipo: string; valor: number }>),
      lastUpdate: new Date().toISOString(),
    }, { merge: true });

    return { sucesso: true };
  });
});

export const cancelarCompraSegura = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(auth.uid);

  const payload = data as CancelarCompraPayload | undefined;
  const compraId = typeof payload?.compraId === "string" ? payload.compraId.trim() : "";

  if (!compraId) {
    throw new HttpsError("invalid-argument", "compraId é obrigatório");
  }

  return db.runTransaction(async (t) => {
    const confeitariaRef = db.collection("confeitaria").doc("dados");
    const financeiroRef = db.collection("financeiro").doc("dados");

    const confeitariaSnap = await t.get(confeitariaRef);
    const financeiroSnap = await t.get(financeiroRef);

    if (!confeitariaSnap.exists) {
      throw new HttpsError("not-found", "Dados da confeitaria não encontrados");
    }

    const confeitariaData = confeitariaSnap.data() ?? {};
    const financeiroData = financeiroSnap.exists ? financeiroSnap.data() ?? {} : {};

    const comprasAtual = Array.isArray(confeitariaData.compras) ? [...confeitariaData.compras] : [];
    const estoqueAtual = { ...(confeitariaData.estoque ?? {}) } as Record<string, number>;

    const compra = comprasAtual.find((item: { id?: string }) => item.id === compraId) as (CompraPayload & { status?: string }) | undefined;
    if (!compra) {
      throw new HttpsError("not-found", "Compra não encontrada");
    }

    if (compra.status === "cancelada") {
      throw new HttpsError("failed-precondition", "Compra já cancelada");
    }

    for (const item of compra.itens) {
      const estoqueItem = Number(estoqueAtual[item.insumoId] ?? 0);
      if (estoqueItem - Number(item.quantidadeGramas ?? 0) < 0) {
        throw new HttpsError("failed-precondition", "Estoque insuficiente para cancelar compra");
      }
    }

    compra.itens.forEach((item) => {
      estoqueAtual[item.insumoId] = Number(estoqueAtual[item.insumoId] ?? 0) - Number(item.quantidadeGramas ?? 0);
    });

    const comprasAtualizadas = comprasAtual.map((item: { id?: string }) =>
      item.id === compraId
        ? {
            ...item,
            status: "cancelada",
            dataCancelamento: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
          }
        : item,
    );

    const transacoes = Array.isArray(financeiroData.transacoes) ? [...financeiroData.transacoes] : [];
    const transacoesAtualizadas = transacoes.filter((tx: { id?: string; idCompra?: string }) => {
      return tx.idCompra !== compraId && tx.id !== `compra_${compraId}`;
    });

    t.set(
      confeitariaRef,
      {
        estoque: estoqueAtual,
        compras: comprasAtualizadas,
        lastUpdate: new Date().toISOString(),
      },
      { merge: true },
    );

    t.set(
      financeiroRef,
      {
        transacoes: transacoesAtualizadas,
        saldo: calcularSaldo(transacoesAtualizadas as Array<{ tipo: string; valor: number }>),
        lastUpdate: new Date().toISOString(),
      },
      { merge: true },
    );

    return { sucesso: true };
  });
});

export const editarCompraSegura = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(auth.uid);

  const payload = data as EditarCompraPayload | undefined;
  const compraId = typeof payload?.compraId === "string" ? payload.compraId.trim() : "";
  const compra = payload?.compra;

  if (!compraId || !compra?.id || !Array.isArray(compra.itens) || compra.itens.length === 0) {
    throw new HttpsError("invalid-argument", "Dados de edição da compra inválidos");
  }

  return db.runTransaction(async (t) => {
    const confeitariaRef = db.collection("confeitaria").doc("dados");
    const financeiroRef = db.collection("financeiro").doc("dados");

    const confeitariaSnap = await t.get(confeitariaRef);
    const financeiroSnap = await t.get(financeiroRef);

    if (!confeitariaSnap.exists) {
      throw new HttpsError("not-found", "Dados da confeitaria não encontrados");
    }

    const confeitariaData = confeitariaSnap.data() ?? {};
    const financeiroData = financeiroSnap.exists ? financeiroSnap.data() ?? {} : {};

    const comprasAtual = Array.isArray(confeitariaData.compras) ? [...confeitariaData.compras] : [];
    const estoqueAtual = { ...(confeitariaData.estoque ?? {}) } as Record<string, number>;
    const insumos = Array.isArray(confeitariaData.insumos) ? confeitariaData.insumos : [];

    const compraAntiga = comprasAtual.find((item: { id?: string }) => item.id === compraId) as (CompraPayload & { status?: string }) | undefined;
    if (!compraAntiga) {
      throw new HttpsError("not-found", "Compra não encontrada");
    }

    if (compraAntiga.status === "cancelada") {
      throw new HttpsError("failed-precondition", "Não é possível editar compra cancelada");
    }

    for (const item of compra.itens) {
      if (!item?.insumoId || !Number.isFinite(item.quantidadeGramas) || item.quantidadeGramas <= 0) {
        throw new HttpsError("invalid-argument", "Item de compra inválido");
      }

      const existeInsumo = insumos.some((insumo: { id?: string }) => insumo.id === item.insumoId);
      if (!existeInsumo) {
        throw new HttpsError("not-found", `Insumo ${item.insumoId} não encontrado`);
      }
    }

    for (const item of compraAntiga.itens) {
      const saldo = Number(estoqueAtual[item.insumoId] ?? 0) - Number(item.quantidadeGramas ?? 0);
      if (saldo < 0) {
        throw new HttpsError("failed-precondition", "Estoque insuficiente para editar compra");
      }
    }

    compraAntiga.itens.forEach((item) => {
      estoqueAtual[item.insumoId] = Number(estoqueAtual[item.insumoId] ?? 0) - Number(item.quantidadeGramas ?? 0);
    });

    compra.itens.forEach((item) => {
      estoqueAtual[item.insumoId] = Number(estoqueAtual[item.insumoId] ?? 0) + Number(item.quantidadeGramas ?? 0);
    });

    const compraAtualizada = {
      ...compra,
      id: compraId,
      editada: true,
      compraOriginalId: compraAntiga.id,
      dataAtualizacao: new Date().toISOString(),
    };

    const comprasAtualizadas = comprasAtual.map((item: { id?: string }) =>
      item.id === compraId ? compraAtualizada : item,
    );

    const totalCompra = compraAtualizada.itens.reduce((sum, item) => sum + Number(item.custoTotal ?? 0), 0);
    const transacaoAtualizada = {
      id: `compra_${compraId}`,
      tipo: "despesa",
      categoria: "compras",
      valor: totalCompra,
      fornecedor: compraAtualizada.fornecedor,
      data: compraAtualizada.data,
      idCompra: compraId,
      descricao: `Compra - ${compraAtualizada.fornecedor}`,
    };

    const transacoes = Array.isArray(financeiroData.transacoes) ? [...financeiroData.transacoes] : [];
    const transacoesAtualizadas = transacoes.map((tx: { id?: string; idCompra?: string }) => {
      if (tx.idCompra === compraId || tx.id === `compra_${compraId}`) {
        return { ...tx, ...transacaoAtualizada };
      }
      return tx;
    });

    const existeTransacao = transacoesAtualizadas.some((tx: { id?: string; idCompra?: string }) => {
      return tx.idCompra === compraId || tx.id === `compra_${compraId}`;
    });

    const transacoesFinal = existeTransacao
      ? transacoesAtualizadas
      : [...transacoesAtualizadas, transacaoAtualizada];

    t.set(
      confeitariaRef,
      {
        estoque: estoqueAtual,
        compras: comprasAtualizadas,
        lastUpdate: new Date().toISOString(),
      },
      { merge: true },
    );

    t.set(
      financeiroRef,
      {
        transacoes: transacoesFinal,
        saldo: calcularSaldo(transacoesFinal as Array<{ tipo: string; valor: number }>),
        lastUpdate: new Date().toISOString(),
      },
      { merge: true },
    );

    return { sucesso: true };
  });
});

export const registrarProducaoSegura = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(auth.uid);

  const producao = data?.producao as ProducaoPayload | undefined;
  if (!producao?.id || !producao.produtoId || !Number.isFinite(producao.quantidadeProduzida) || producao.quantidadeProduzida <= 0) {
    throw new HttpsError("invalid-argument", "Produção inválida");
  }

  return db.runTransaction(async (t) => {
    const confeitariaRef = db.collection("confeitaria").doc("dados");
    const confeitariaSnap = await t.get(confeitariaRef);

    if (!confeitariaSnap.exists) {
      throw new HttpsError("not-found", "Documento de confeitaria não encontrado");
    }

    const confeitariaData = confeitariaSnap.data() ?? {};
    const insumos = Array.isArray(confeitariaData.insumos) ? [...confeitariaData.insumos] : [];
    const produtos = Array.isArray(confeitariaData.produtos) ? [...confeitariaData.produtos] : [];
    const producoes = Array.isArray(confeitariaData.producoes) ? [...confeitariaData.producoes] : [];

    const produtoIndex = produtos.findIndex((p: { id?: string }) => p.id === producao.produtoId);
    if (produtoIndex < 0) {
      throw new HttpsError("not-found", "Produto não encontrado");
    }

    const produtoSelecionado = produtos[produtoIndex] as {
      id: string;
      nome?: string;
      estoqueUnidades?: number;
      receita?: ReceitaProduto[];
    };

    const receita = Array.isArray(produtoSelecionado.receita) ? produtoSelecionado.receita : [];
    if (receita.length === 0) {
      throw new HttpsError("failed-precondition", "Produto sem receita vinculada");
    }

    for (const ingrediente of receita) {
      const idx = insumos.findIndex((insumo: { id?: string }) => insumo.id === ingrediente.insumoId);
      if (idx < 0) {
        throw new HttpsError("not-found", `Insumo ${ingrediente.insumoId} não encontrado`);
      }

      const insumo = insumos[idx] as { estoqueGramas?: number; nome?: string };
      const necessario = Number(ingrediente.quantidadeGramas ?? 0) * Number(producao.quantidadeProduzida);
      const estoqueAtual = Number(insumo.estoqueGramas ?? 0);
      if (necessario <= 0 || estoqueAtual < necessario) {
        throw new HttpsError("failed-precondition", `Estoque insuficiente para ${insumo.nome ?? "insumo"}`);
      }
    }

    for (const ingrediente of receita) {
      const idx = insumos.findIndex((insumo: { id?: string }) => insumo.id === ingrediente.insumoId);
      const insumo = insumos[idx] as {
        estoqueGramas?: number;
        pesoEmbalagemGramas?: number;
      };

      const consumo = Number(ingrediente.quantidadeGramas ?? 0) * Number(producao.quantidadeProduzida);
      const estoqueNovo = Math.max(0, Number(insumo.estoqueGramas ?? 0) - consumo);
      const pesoEmbalagem = Number(insumo.pesoEmbalagemGramas ?? 0);

      insumos[idx] = {
        ...insumo,
        estoqueGramas: estoqueNovo,
        estoqueEmbalagens: pesoEmbalagem > 0 ? Math.ceil(estoqueNovo / pesoEmbalagem) : 0,
        dataAtualizacao: new Date().toISOString(),
      };
    }

    produtos[produtoIndex] = {
      ...produtoSelecionado,
      estoqueUnidades: Number(produtoSelecionado.estoqueUnidades ?? 0) + Number(producao.quantidadeProduzida),
      dataAtualizacao: new Date().toISOString(),
    };

    const producaoConfirmada = {
      ...producao,
      confirmado: true,
      dataConfirmacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };

    t.set(confeitariaRef, {
      insumos,
      produtos,
      producoes: [...producoes, producaoConfirmada],
      lastUpdate: new Date().toISOString(),
    }, { merge: true });

    return { sucesso: true, produtoId: producao.produtoId };
  });
});

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizarCheckoutPayload(data: Record<string, unknown>): CheckoutDeliveryPayload {
  const clienteRaw = asRecord(data.cliente);
  const enderecoRaw = asRecord(data.endereco);
  const pagamentoRaw = asRecord(data.pagamento);
  const observacao = asString(data.observacao);

  const itensRaw = Array.isArray(data.itens) ? data.itens : [];
  const itens: ItemPedidoDeliveryEntrada[] = itensRaw.map((item) => {
    const registro = asRecord(item);
    return {
      produtoId: asString(registro.produtoId),
      quantidade: asNumber(registro.quantidade),
      observacao: asString(registro.observacao),
    };
  });

  const tipoEndereco = asString(enderecoRaw.tipo);
  const tipoPagamento = asString(pagamentoRaw.tipo);

  return {
    cliente: {
      nome: asString(clienteRaw.nome),
      whatsapp: asString(clienteRaw.whatsapp),
    },
    endereco: {
      tipo: tipoEndereco === "retirada" ? "retirada" : "entrega",
      logradouro: asString(enderecoRaw.logradouro),
      numero: asString(enderecoRaw.numero),
      complemento: asString(enderecoRaw.complemento),
      bairro: asString(enderecoRaw.bairro),
      cidade: asString(enderecoRaw.cidade),
      referencia: asString(enderecoRaw.referencia),
      cep: asString(enderecoRaw.cep),
    },
    pagamento: {
      tipo: tipoPagamento === "pix" || tipoPagamento === "cartao" ? (tipoPagamento as "pix" | "cartao") : "dinheiro",
      trocoPara: asNumber(pagamentoRaw.trocoPara),
    },
    observacao,
    itens,
  };
}

function validarCheckoutDelivery(payload: CheckoutDeliveryPayload): void {
  if (!payload.cliente.nome || payload.cliente.nome.length < 2) {
    throw new HttpsError("invalid-argument", "Nome do cliente é obrigatório");
  }

  if (!payload.cliente.whatsapp || payload.cliente.whatsapp.length < 8) {
    throw new HttpsError("invalid-argument", "WhatsApp do cliente é obrigatório");
  }

  if (payload.endereco.tipo === "entrega") {
    if (!payload.endereco.logradouro || !payload.endereco.numero || !payload.endereco.bairro || !payload.endereco.cidade) {
      throw new HttpsError("invalid-argument", "Endereço incompleto para entrega");
    }
  }

  if (!Array.isArray(payload.itens) || payload.itens.length === 0) {
    throw new HttpsError("invalid-argument", "Carrinho vazio");
  }

  for (const item of payload.itens) {
    if (!item.produtoId || !Number.isFinite(item.quantidade) || item.quantidade <= 0) {
      throw new HttpsError("invalid-argument", "Item inválido no carrinho");
    }
  }
}

export const criarPedidoDelivery = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const auth = request.auth;

  const payload = normalizarCheckoutPayload(asRecord(request.data));
  validarCheckoutDelivery(payload);

  try {
    const resultado = await db.runTransaction(async (tx) => {
      let total = 0;
    const itensValidados: Array<{
      produtoId: string;
      nome: string;
      quantidade: number;
      precoUnitario: number;
      observacao: string;
    }> = [];

    for (const item of payload.itens) {
      const produtoRef = db.collection("produtos").doc(item.produtoId);
      const produtoSnap = await tx.get(produtoRef);

      if (!produtoSnap.exists) {
        throw new HttpsError("not-found", `Produto ${item.produtoId} não encontrado`);
      }

      const produto = produtoSnap.data() as {
        nome?: string;
        ativo?: boolean;
        precoVenda?: number;
        preco?: number;
        estoqueUnidades?: number;
      };

      if (!produto.ativo) {
        throw new HttpsError("failed-precondition", `${produto.nome ?? "Produto"} indisponível`);
      }

      const estoqueAtual = Number(produto.estoqueUnidades ?? 0);
      if (estoqueAtual < item.quantidade) {
        throw new HttpsError("failed-precondition", `Estoque insuficiente para ${produto.nome ?? "produto"}`);
      }

      const precoUnitario = Number(produto.precoVenda ?? produto.preco ?? 0);
      if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) {
        throw new HttpsError("failed-precondition", `Preço inválido para ${produto.nome ?? "produto"}`);
      }

      total += precoUnitario * item.quantidade;
      itensValidados.push({
        produtoId: item.produtoId,
        nome: String(produto.nome ?? "Produto"),
        quantidade: item.quantidade,
        precoUnitario,
        observacao: asString(item.observacao),
      });
    }

    const pedidoRef = db.collection("pedidos").doc();
    const vendaRef = db.collection("vendas").doc();
    const agoraIso = new Date().toISOString();

      const pedido = {
      id: pedidoRef.id,
      clienteUid: auth.uid,
      cliente: payload.cliente.nome,
      clienteContato: {
        whatsapp: payload.cliente.whatsapp,
      },
      itens: itensValidados,
      total,
      origem: "delivery",
      status: "pendente",
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      criadoEmIso: agoraIso,
      atualizadoEm: agoraIso,
      observacao: payload.observacao,
      pagamento: {
        tipo: payload.pagamento.tipo,
        trocoPara: payload.pagamento.tipo === "dinheiro" ? payload.pagamento.trocoPara : 0,
      },
      endereco: payload.endereco,
      tempoEstimadoMinutos: 45,
        vendaId: vendaRef.id,
        estoqueBaixado: false,
      };

    tx.set(pedidoRef, pedido);

    tx.set(db.collection("filaCozinha").doc(pedidoRef.id), {
      pedidoId: pedidoRef.id,
      cliente: payload.cliente.nome,
      itens: itensValidados,
      valor: total,
      status: "pendente",
      origem: "delivery",
      enviadoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: agoraIso,
    }, { merge: true });

      tx.set(vendaRef, {
      id: vendaRef.id,
      pedidoId: pedidoRef.id,
      origem: "delivery",
      cliente: payload.cliente.nome,
      produtos: itensValidados.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      })),
      total,
      status: "pendente_delivery",
      financeiroRegistrado: false,
      data: agoraIso,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        pedidoId: pedidoRef.id,
        total,
        status: "pendente",
        tempoEstimadoMinutos: 45,
      };
    });

    await registrarLogIntegracao(
      "criar_pedido_delivery",
      {
        cliente: payload.cliente.nome,
        totalItens: payload.itens.length,
        total: resultado.total,
      },
      true,
      auth.uid,
    );

    await registrarLogSistema(
      "pedido_criado",
      {
        pedidoId: resultado.pedidoId,
        origem: "delivery",
        total: resultado.total,
        totalItens: payload.itens.length,
      },
      auth.uid,
    );

    return resultado;
  } catch (error) {
    await registrarLogIntegracao(
      "criar_pedido_delivery",
      {
        cliente: payload.cliente.nome,
        totalItens: payload.itens.length,
        erro: error instanceof Error ? error.message : "erro desconhecido",
      },
      false,
      auth.uid,
    );
    throw error;
  }
});

export const baixarEstoque = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertRole(request.auth.uid, ["admin", "atendente", "cozinha"], "Sem permissão para baixar estoque");

  const payload = asRecord(request.data);
  const pedidoId = asString(payload.pedidoId);

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "pedidoId é obrigatório");
  }

  try {
    const resultado = await baixarEstoquePedido(pedidoId, request.auth.uid);
    await registrarLogIntegracao("baixar_estoque", { pedidoId }, true, request.auth.uid);
    return { sucesso: true, ...resultado };
  } catch (error) {
    await registrarLogIntegracao(
      "baixar_estoque",
      { pedidoId, erro: error instanceof Error ? error.message : "erro desconhecido" },
      false,
      request.auth.uid,
    );
    throw error;
  }
});

export const restaurarEstoqueCancelamento = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertRole(request.auth.uid, ["admin", "atendente"], "Sem permissão para restaurar estoque");

  const payload = asRecord(request.data);
  const pedidoId = asString(payload.pedidoId);

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "pedidoId é obrigatório");
  }

  try {
    const resultado = await restaurarEstoquePedidoCancelamento(pedidoId, request.auth.uid);
    await registrarLogIntegracao("restaurar_estoque_cancelamento", { pedidoId }, true, request.auth.uid);
    return { sucesso: true, ...resultado };
  } catch (error) {
    await registrarLogIntegracao(
      "restaurar_estoque_cancelamento",
      { pedidoId, erro: error instanceof Error ? error.message : "erro desconhecido" },
      false,
      request.auth.uid,
    );
    throw error;
  }
});

export const autenticarIfood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(request.auth.uid);
  return autenticarIfoodService();
});

export const enviarCardapio = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(request.auth.uid);

  const payload = asRecord(request.data);
  const cardapio = asRecord(payload.cardapio);

  return enviarCardapioService(cardapio);
});

export const sincronizarProdutosIfood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(request.auth.uid);

  try {
    const resultado = await sincronizarTodosProdutosComIfood();
    await registrarLogIntegracao("sincronizar_produtos_ifood", { ok: true }, true, request.auth.uid);
    return resultado;
  } catch (error) {
    await registrarLogIntegracao(
      "sincronizar_produtos_ifood",
      { erro: error instanceof Error ? error.message : "erro desconhecido" },
      false,
      request.auth.uid,
    );
    throw error;
  }
});

export const atualizarProduto = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(request.auth.uid);

  const payload = asRecord(request.data);
  const produtoId = String(payload.produtoId ?? "").trim();
  const produto = asRecord(payload.produto);

  if (!produtoId) {
    throw new HttpsError("invalid-argument", "produtoId é obrigatório");
  }

  return atualizarProdutoService(produtoId, produto);
});

export const aceitarPedidoIfood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertRole(request.auth.uid, ["admin", "atendente"], "Sem permissão para aceitar pedido iFood");

  const payload = asRecord(request.data);
  const pedidoId = String(payload.pedidoId ?? "").trim();

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "pedidoId é obrigatório");
  }

  const resultado = await aceitarPedidoIfoodService(pedidoId, request.auth.uid);
  await atualizarFilaCozinhaPorPedido(pedidoId, "aceito", request.auth.uid);
  await sincronizarVendaEFinanceiroPorPedido(pedidoId, "aceito", request.auth.uid);
  return resultado;
});

export const rejeitarPedidoIfood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertRole(request.auth.uid, ["admin", "atendente"], "Sem permissão para rejeitar pedido iFood");

  const payload = asRecord(request.data);
  const pedidoId = String(payload.pedidoId ?? "").trim();

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "pedidoId é obrigatório");
  }

  const resultado = await rejeitarPedidoIfoodService(pedidoId, request.auth.uid);
  await atualizarFilaCozinhaPorPedido(pedidoId, "cancelado", request.auth.uid);
  await sincronizarVendaEFinanceiroPorPedido(pedidoId, "cancelado", request.auth.uid);
  return resultado;
});

export const atualizarStatusPedidoIfood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const payload = asRecord(request.data);
  const pedidoId = String(payload.pedidoId ?? "").trim();
  const status = String(payload.status ?? "").trim().toLowerCase();

  if (!pedidoId || !status) {
    throw new HttpsError("invalid-argument", "pedidoId e status são obrigatórios");
  }

  if (status === "preparando") {
    await assertRole(
      request.auth.uid,
      ["admin", "atendente", "cozinha"],
      "Sem permissão para iniciar preparo"
    );
  } else {
    await assertRole(
      request.auth.uid,
      ["admin", "atendente"],
      "Sem permissão para atualizar status do pedido"
    );
  }

  if (
    status !== "preparando" &&
    status !== "saiu_entrega" &&
    status !== "entregue" &&
    status !== "cancelado"
  ) {
    throw new HttpsError("invalid-argument", "Status inválido");
  }

  const resultado = await atualizarStatusPedidoIfoodService(
    pedidoId,
    status as "preparando" | "saiu_entrega" | "entregue" | "cancelado",
    request.auth.uid
  );

  await atualizarFilaCozinhaPorPedido(
    pedidoId,
    status as StatusPedidoOperacional,
    request.auth.uid,
  );
  await sincronizarVendaEFinanceiroPorPedido(
    pedidoId,
    status as StatusPedidoOperacional,
    request.auth.uid,
  );

  return resultado;
});

export const atualizarStatusPedido = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const payload = asRecord(request.data);
  const pedidoId = asString(payload.pedidoId);
  const status = validarStatusEntrada(asString(payload.status));

  if (!pedidoId) {
    throw new HttpsError("invalid-argument", "pedidoId é obrigatório");
  }

  if (status === "preparando") {
    await assertRole(request.auth.uid, ["admin", "atendente", "cozinha"], "Sem permissão para iniciar preparo");
  } else {
    await assertRole(request.auth.uid, ["admin", "atendente"], "Sem permissão para atualizar status");
  }

  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();
  const pedido = normalizarPedido(pedidoSnap);

  try {
    if (pedido.origem === "ifood") {
      if (status === "aceito") {
        const resultado = await aceitarPedidoIfoodService(pedidoId, request.auth.uid);
        await atualizarFilaCozinhaPorPedido(pedidoId, status, request.auth.uid);
        await sincronizarVendaEFinanceiroPorPedido(pedidoId, status, request.auth.uid);
        await registrarLogIntegracao("atualizar_status_pedido", { pedidoId, origem: "ifood", status }, true, request.auth.uid);
        return resultado;
      }

      const resultado = await atualizarStatusPedidoIfoodService(
        pedidoId,
        status as "preparando" | "saiu_entrega" | "entregue" | "cancelado",
        request.auth.uid,
      );

      await atualizarFilaCozinhaPorPedido(pedidoId, status, request.auth.uid);
      await sincronizarVendaEFinanceiroPorPedido(pedidoId, status, request.auth.uid);

      await registrarLogIntegracao("atualizar_status_pedido", { pedidoId, origem: "ifood", status }, true, request.auth.uid);
      return resultado;
    }

    if (status === "aceito") {
      await baixarEstoquePedido(pedidoId, request.auth.uid);
    }

    if (status === "cancelado") {
      await restaurarEstoquePedidoCancelamento(pedidoId, request.auth.uid);
    }

    await pedidoRef.set(
      {
        status,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: request.auth.uid,
      },
      { merge: true },
    );

    await atualizarFilaCozinhaPorPedido(pedidoId, status, request.auth.uid);
    await sincronizarVendaEFinanceiroPorPedido(pedidoId, status, request.auth.uid);

    await registrarLogIntegracao("atualizar_status_pedido", { pedidoId, origem: "delivery", status }, true, request.auth.uid);

    return { sucesso: true, pedidoId, status };
  } catch (error) {
    await registrarLogIntegracao(
      "atualizar_status_pedido",
      { pedidoId, status, erro: error instanceof Error ? error.message : "erro desconhecido" },
      false,
      request.auth.uid,
    );
    throw error;
  }
});

export const vincularProdutoNaoMapeadoIfood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertRole(
    request.auth.uid,
    ["admin", "atendente"],
    "Sem permissão para vincular produto iFood"
  );

  const payload = asRecord(request.data);
  const naoMapeadoId = String(payload.naoMapeadoId ?? "").trim();
  const produtoId = String(payload.produtoId ?? "").trim();

  if (!naoMapeadoId || !produtoId) {
    throw new HttpsError("invalid-argument", "naoMapeadoId e produtoId são obrigatórios");
  }

  try {
    return await vincularProdutoNaoMapeadoService(naoMapeadoId, produtoId, request.auth.uid);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao vincular produto não mapeado";
    throw new HttpsError("internal", mensagem);
  }
});

export const migrarMapeamentoProdutosIfood = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  await assertAdmin(request.auth.uid);

  const payload = asRecord(request.data);
  const apply = Boolean(payload.apply);
  const incluirPendentes = Boolean(payload.incluirPendentes);
  const limite = Number(payload.limite ?? 1000);

  try {
    const resultado = await executarMigracaoMapeamentoProdutosIfood({
      apply,
      incluirPendentes,
      limite: Number.isFinite(limite) && limite > 0 ? limite : 1000,
    });

    await registrarLogIntegracao(
      "migrar_mapeamento_produtos_ifood",
      {
        apply,
        incluirPendentes,
        limite,
        total: (resultado as { total?: number }).total ?? null,
      },
      true,
      request.auth.uid,
    );

    return resultado;
  } catch (error) {
    await registrarLogIntegracao(
      "migrar_mapeamento_produtos_ifood",
      {
        apply,
        incluirPendentes,
        limite,
        erro: error instanceof Error ? error.message : "erro desconhecido",
      },
      false,
      request.auth.uid,
    );

    const mensagem = error instanceof Error ? error.message : "Falha na migração de mapeamento iFood";
    throw new HttpsError("internal", mensagem);
  }
});

export const integrarPedidoIfoodWebhook = onRequest(async (req, res) => {
  const path = req.path || "/";

  if (path !== "/webhook") {
    res.status(404).json({ sucesso: false, erro: "Endpoint não encontrado" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ sucesso: false, erro: "Método não permitido" });
    return;
  }

  try {
    const resultado = await receberPedidosWebhook(req.headers, req.body);
    await registrarLogIntegracao(
      "integrar_pedido_ifood_webhook",
      { processados: resultado.processados, pedidosIds: resultado.pedidosIds },
      true,
    );
    res.status(200).json({ sucesso: true, ...resultado });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao processar webhook iFood";
    await registrarLogIntegracao(
      "integrar_pedido_ifood_webhook",
      { erro: mensagem },
      false,
    );
    res.status(401).json({ sucesso: false, erro: mensagem });
  }
});

export const ifood = integrarPedidoIfoodWebhook;
