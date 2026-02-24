import { IncomingHttpHeaders } from "http";
import { mapearProdutoIfood, registrarProdutoNaoMapeado } from "./mapeamentoProdutoService";
import { admin, db } from "./firebase";

type Registro = Record<string, unknown>;

export interface IfoodCredenciais {
  ativo: boolean;
  clientId: string;
  clientSecret: string;
  merchantId: string;
  urlAutenticacao: string;
  urlCardapio: string;
  urlProduto: string;
  urlStatusPedido: string;
  tokenWebhook: string;
}

export interface ItemPedido {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  ifoodProductId?: string;
  externalCode?: string;
  produtoIdInterno?: string;
  mapeado?: boolean;
}

export interface PedidoIfood {
  id: string;
  cliente: string;
  itens: ItemPedido[];
  valor: number;
  status: StatusPedido;
  origem: "ifood";
  estoqueBaixado: boolean;
}

interface ProdutoIfood {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria: string;
}

const STATUS_PERMITIDOS = ["pendente", "aceito", "preparando", "saiu_entrega", "entregue", "cancelado"] as const;
type StatusPedido = (typeof STATUS_PERMITIDOS)[number];

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
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

function normalizarStatusPedido(status: string): StatusPedido {
  const texto = status.trim().toLowerCase();

  if (texto.includes("accept") || texto.includes("aceit")) return "aceito";
  if (texto.includes("prepar")) return "preparando";
  if (texto.includes("dispatch") || texto.includes("saiu") || texto.includes("out_for_delivery")) return "saiu_entrega";
  if (texto.includes("deliver") || texto.includes("entreg")) return "entregue";
  if (texto.includes("cancel")) return "cancelado";
  return "pendente";
}

function validarStatusPermitido(status: string): StatusPedido {
  const normalizado = normalizarStatusPedido(status);
  if (!STATUS_PERMITIDOS.includes(normalizado)) {
    throw new Error(`Status inválido: ${status}`);
  }
  return normalizado;
}

async function registrarLogIntegracao(evento: string, dados: Registro, sucesso: boolean): Promise<void> {
  await db.collection("logsIntegracao").add({
    evento,
    sucesso,
    dados,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    criadoEmIso: new Date().toISOString(),
  });
}

async function registrarLogSistema(evento: string, dados: Registro, usuarioId?: string): Promise<void> {
  await db.collection("logsSistema").add({
    evento,
    usuarioId: usuarioId ?? null,
    dados,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    criadoEmIso: new Date().toISOString(),
  });
}

function normalizarItems(payload: unknown): ItemPedido[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, indice) => {
    const registroItem = asRegistro(item);
    const ifoodProductId = asTexto(registroItem.ifoodProductId || registroItem.productId || registroItem.id);
    const externalCode = asTexto(registroItem.externalCode || registroItem.code || registroItem.sku || registroItem.id);
    const id = asTexto(ifoodProductId || externalCode || `item-${indice + 1}`);
    const nome = asTexto(registroItem.name || registroItem.nome || "Item sem nome");
    const quantidade = asNumero(registroItem.quantity || registroItem.quantidade || 1);
    const precoUnitario = asNumero(
      registroItem.unitPrice ||
        registroItem.precoUnitario ||
        registroItem.price ||
        registroItem.valorUnitario ||
        0
    );
    const produtoIdInterno = asTexto(registroItem.produtoIdInterno);
    const mapeado = Boolean(registroItem.mapeado);

    return {
      id,
      nome,
      quantidade: quantidade > 0 ? quantidade : 1,
      precoUnitario,
      ifoodProductId,
      externalCode,
      produtoIdInterno,
      mapeado,
    };
  });
}

function validarCamposObrigatorios(credenciais: IfoodCredenciais): void {
  const camposObrigatorios: Array<keyof IfoodCredenciais> = [
    "clientId",
    "clientSecret",
    "merchantId",
    "urlAutenticacao",
    "urlCardapio",
    "urlProduto",
    "urlStatusPedido",
    "tokenWebhook",
  ];

  const faltantes = camposObrigatorios.filter((campo) => !String(credenciais[campo] || "").trim());

  if (!credenciais.ativo) {
    throw new Error("Integração iFood está desativada");
  }

  if (faltantes.length > 0) {
    throw new Error(`Credenciais iFood incompletas: ${faltantes.join(", ")}`);
  }
}

export async function carregarCredenciaisIfood(): Promise<IfoodCredenciais> {
  const snap = await db.collection("integracoes").doc("integracaoIfood").get();

  if (!snap.exists) {
    throw new Error("Documento integracoes/integracaoIfood não encontrado");
  }

  const dados = asRegistro(snap.data());

  const credenciais: IfoodCredenciais = {
    ativo: Boolean(dados.ativo),
    clientId: asTexto(dados.clientId),
    clientSecret: asTexto(dados.clientSecret),
    merchantId: asTexto(dados.merchantId),
    urlAutenticacao: asTexto(dados.urlAutenticacao),
    urlCardapio: asTexto(dados.urlCardapio),
    urlProduto: asTexto(dados.urlProduto),
    urlStatusPedido: asTexto(dados.urlStatusPedido),
    tokenWebhook: asTexto(dados.tokenWebhook),
  };

  validarCamposObrigatorios(credenciais);
  return credenciais;
}

function extrairTokenWebhook(headers: IncomingHttpHeaders): string {
  const tokenHeader = headers["x-ifood-token"];
  if (typeof tokenHeader === "string" && tokenHeader.trim()) {
    return tokenHeader.trim();
  }

  const assinatura = headers["x-ifood-signature"];
  if (typeof assinatura === "string" && assinatura.trim()) {
    return assinatura.trim();
  }

  const authorization = headers.authorization;
  if (typeof authorization === "string" && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

async function requisicaoIfood(
  url: string,
  metodo: "POST" | "PUT" | "PATCH",
  token: string,
  corpo: Registro
): Promise<Registro> {
  const resposta = await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(corpo),
  });

  const dados = asRegistro(await resposta.json());

  if (!resposta.ok) {
    await registrarLogIntegracao(
      "ifood_requisicao_falha",
      { url, metodo, status: resposta.status, resposta: dados },
      false,
    );
    throw new Error(`Falha na integração iFood: HTTP ${resposta.status}`);
  }

  return dados;
}

function converterProdutoParaIfood(id: string, payload: unknown): ProdutoIfood | null {
  const registro = asRegistro(payload);
  const ifoodProductId = asTexto(registro.ifoodProductId);
  const externalCode = asTexto(registro.externalCode);
  const nome = asTexto(registro.nome || registro.name);
  const preco = asNumero(registro.precoVenda || registro.preco || registro.price);
  const descricao = asTexto(registro.descricao || registro.description);
  const categoria = asTexto(registro.categoria || registro.category);

  if (!nome || preco <= 0 || !descricao || !categoria) {
    return null;
  }

  return {
    id: ifoodProductId || externalCode || id,
    nome,
    preco,
    descricao,
    categoria,
  };
}

export async function autenticarIfood(): Promise<{ accessToken: string; expiresIn: number }> {
  const credenciais = await carregarCredenciaisIfood();

  const resposta = await fetch(credenciais.urlAutenticacao, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: credenciais.clientId,
      clientSecret: credenciais.clientSecret,
      merchantId: credenciais.merchantId,
    }),
  });

  const payload = asRegistro(await resposta.json());

  if (!resposta.ok) {
    throw new Error(`Não foi possível autenticar no iFood: HTTP ${resposta.status}`);
  }

  const accessToken = asTexto(payload.accessToken || payload.access_token);
  const expiresIn = asNumero(payload.expiresIn || payload.expires_in || 0);

  if (!accessToken) {
    throw new Error("Token de acesso do iFood não retornado");
  }

  return {
    accessToken,
    expiresIn,
  };
}

export async function enviarCardapio(cardapio: Registro): Promise<Registro> {
  const credenciais = await carregarCredenciaisIfood();
  const { accessToken } = await autenticarIfood();

  return requisicaoIfood(credenciais.urlCardapio, "POST", accessToken, {
    merchantId: credenciais.merchantId,
    cardapio,
  });
}

export async function sincronizarTodosProdutosComIfood(): Promise<{
  totalLidos: number;
  totalSincronizados: number;
  totalIgnorados: number;
  respostaIfood: Registro;
}> {
  const produtosSnap = await db.collection("produtos").get();

  const produtosConvertidos: ProdutoIfood[] = [];
  let ignorados = 0;

  for (const docSnap of produtosSnap.docs) {
    const convertido = converterProdutoParaIfood(docSnap.id, docSnap.data());
    if (!convertido) {
      ignorados += 1;
      continue;
    }
    produtosConvertidos.push(convertido);
  }

  const respostaIfood = await enviarCardapio({ produtos: produtosConvertidos });

  await db.collection("integracoes").doc("integracaoIfood").set(
    {
      ultimaSincronizacaoProdutos: new Date().toISOString(),
      totalProdutosSincronizados: produtosConvertidos.length,
      totalProdutosIgnorados: ignorados,
      totalProdutosLidos: produtosSnap.size,
    },
    { merge: true }
  );

  return {
    totalLidos: produtosSnap.size,
    totalSincronizados: produtosConvertidos.length,
    totalIgnorados: ignorados,
    respostaIfood,
  };
}

export async function atualizarProduto(produtoId: string, produto: Registro): Promise<Registro> {
  if (!produtoId.trim()) {
    throw new Error("produtoId é obrigatório");
  }

  const credenciais = await carregarCredenciaisIfood();
  const { accessToken } = await autenticarIfood();
  const url = `${credenciais.urlProduto.replace(/\/$/, "")}/${produtoId}`;

  return requisicaoIfood(url, "PATCH", accessToken, {
    merchantId: credenciais.merchantId,
    produto,
  });
}

async function atualizarStatusNoIfoodExterno(pedidoId: string, status: StatusPedido): Promise<Registro> {
  const credenciais = await carregarCredenciaisIfood();
  const { accessToken } = await autenticarIfood();
  const url = `${credenciais.urlStatusPedido.replace(/\/$/, "")}/${pedidoId}`;

  return requisicaoIfood(url, "POST", accessToken, {
    merchantId: credenciais.merchantId,
    status,
  });
}

async function mapearItemPedido(pedidoId: string, item: ItemPedido): Promise<ItemPedido> {
  const ifoodProductId = asTexto(item.ifoodProductId || item.id);
  const externalCode = asTexto(item.externalCode || item.id);

  const produtoMapeado = await mapearProdutoIfood({
    ifoodProductId,
    externalCode,
    nome: item.nome,
  });

  if (!produtoMapeado) {
    await registrarProdutoNaoMapeado({
      pedidoId,
      itemId: item.id,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      ifoodProductId,
      externalCode,
    });

    return {
      ...item,
      ifoodProductId,
      externalCode,
      mapeado: false,
      produtoIdInterno: "",
    };
  }

  return {
    ...item,
    ifoodProductId,
    externalCode,
    produtoIdInterno: produtoMapeado.id,
    mapeado: true,
  };
}

async function mapearItensPedido(pedido: PedidoIfood): Promise<ItemPedido[]> {
  const itensMapeados: ItemPedido[] = [];

  for (const item of pedido.itens) {
    const itemMapeado = await mapearItemPedido(pedido.id, item);
    itensMapeados.push(itemMapeado);
  }

  return itensMapeados;
}

function mapearPedido(payload: unknown): PedidoIfood {
  const registro = asRegistro(payload);
  const clienteRegistro = asRegistro(registro.customer || registro.cliente);

  const id = asTexto(registro.id || registro.orderId || registro.code);
  const cliente = asTexto(clienteRegistro.name || clienteRegistro.nome || registro.customerName || "Cliente iFood");
  const itens = normalizarItems(registro.items || registro.itens);

  const valorDireto = asNumero(registro.total || registro.valor || registro.totalPrice);
  const valorItens = itens.reduce((acumulado, item) => acumulado + item.precoUnitario * item.quantidade, 0);
  const valor = valorDireto > 0 ? valorDireto : valorItens;

  return {
    id,
    cliente,
    itens,
    valor,
    status: "pendente",
    origem: "ifood",
    estoqueBaixado: false,
  };
}

async function encontrarProdutoPorItem(item: ItemPedido): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  if ((item.produtoIdInterno || "").trim()) {
    const porIdInterno = await db.collection("produtos").doc(item.produtoIdInterno || "").get();
    if (porIdInterno.exists) return porIdInterno;
  }

  const mapeado = await mapearProdutoIfood({
    ifoodProductId: asTexto(item.ifoodProductId || item.id),
    externalCode: asTexto(item.externalCode || item.id),
    nome: item.nome,
  });

  if (mapeado) {
    const porId = await db.collection("produtos").doc(mapeado.id).get();
    if (porId.exists) return porId;
  }

  return null;
}

async function baixarEstoquePedido(pedido: PedidoIfood, usuarioId?: string): Promise<void> {
  let itensBaixados = 0;

  for (const item of pedido.itens) {
    const produtoSnap = await encontrarProdutoPorItem(item);
    if (!produtoSnap || !produtoSnap.exists) {
      await registrarProdutoNaoMapeado({
        pedidoId: pedido.id,
        itemId: item.id,
        nome: item.nome,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        ifoodProductId: item.ifoodProductId,
        externalCode: item.externalCode,
      });
      continue;
    }

    await db.runTransaction(async (tx) => {
      const atual = await tx.get(produtoSnap.ref);
      if (!atual.exists) return;

      const dados = asRegistro(atual.data());
      const estoqueAtual = asNumero(dados.estoqueUnidades);
      if (estoqueAtual < item.quantidade) {
        throw new Error(`Estoque insuficiente para ${item.nome}`);
      }

      tx.update(produtoSnap.ref, {
        estoqueUnidades: estoqueAtual - item.quantidade,
        dataAtualizacao: new Date().toISOString(),
      });
    });

    itensBaixados += 1;
  }

  await registrarLogSistema(
    "alteracao_estoque",
    {
      tipo: "baixa",
      pedidoId: pedido.id,
      origem: "ifood",
      itensProcessados: itensBaixados,
    },
    usuarioId,
  );
}

async function devolverEstoquePedido(pedido: PedidoIfood, usuarioId?: string): Promise<void> {
  let itensEstornados = 0;

  for (const item of pedido.itens) {
    const produtoSnap = await encontrarProdutoPorItem(item);
    if (!produtoSnap || !produtoSnap.exists) {
      continue;
    }

    await db.runTransaction(async (tx) => {
      const atual = await tx.get(produtoSnap.ref);
      if (!atual.exists) return;

      const dados = asRegistro(atual.data());
      const estoqueAtual = asNumero(dados.estoqueUnidades);

      tx.update(produtoSnap.ref, {
        estoqueUnidades: estoqueAtual + item.quantidade,
        dataAtualizacao: new Date().toISOString(),
      });
    });

    itensEstornados += 1;
  }

  await registrarLogSistema(
    "alteracao_estoque",
    {
      tipo: "estorno",
      pedidoId: pedido.id,
      origem: "ifood",
      itensProcessados: itensEstornados,
    },
    usuarioId,
  );
}

async function atualizarEstoquePorPedido(pedido: PedidoIfood, usuarioId?: string): Promise<void> {
  await baixarEstoquePedido(pedido, usuarioId);
}

async function enviarPedidoParaCozinha(pedido: PedidoIfood): Promise<void> {
  await db.collection("filaCozinha").doc(pedido.id).set(
    {
      pedidoId: pedido.id,
      cliente: pedido.cliente,
      itens: pedido.itens,
      valor: pedido.valor,
      status: pedido.status,
      origem: pedido.origem,
      enviadoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function salvarPedido(pedido: PedidoIfood, payloadOriginal: unknown): Promise<void> {
  if (!pedido.id) {
    throw new Error("Pedido recebido sem identificador");
  }

  await db.collection("pedidos").doc(pedido.id).set(
    {
      ...pedido,
      atualizadoEm: new Date().toISOString(),
      recebidoEm: admin.firestore.FieldValue.serverTimestamp(),
      payloadOriginal,
    },
    { merge: true }
  );

  await db.collection("vendas").doc(pedido.id).set(
    {
      id: pedido.id,
      pedidoId: pedido.id,
      origem: "ifood",
      cliente: pedido.cliente,
      produtos: pedido.itens.map((item) => ({
        produtoId: item.produtoIdInterno || item.ifoodProductId || item.id,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      })),
      total: pedido.valor,
      status: "pendente_ifood",
      financeiroRegistrado: false,
      data: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await registrarLogSistema("pedido_criado", {
    pedidoId: pedido.id,
    origem: "ifood",
    status: pedido.status,
    total: pedido.valor,
    totalItens: pedido.itens.length,
  });
}

function extrairPedidosDoPayload(payload: unknown): unknown[] {
  const registro = asRegistro(payload);

  if (Array.isArray(registro.orders)) {
    return registro.orders;
  }

  if (Array.isArray(registro.pedidos)) {
    return registro.pedidos;
  }

  if (Array.isArray(registro.events)) {
    return registro.events;
  }

  return [payload];
}

export async function receberPedidosWebhook(
  headers: IncomingHttpHeaders,
  payload: unknown
): Promise<{ processados: number; pedidosIds: string[] }> {
  const credenciais = await carregarCredenciaisIfood();
  const tokenRecebido = extrairTokenWebhook(headers);

  if (!tokenRecebido || tokenRecebido !== credenciais.tokenWebhook) {
    await registrarLogIntegracao("ifood_webhook_token_invalido", { payload: asRegistro(payload) }, false);
    throw new Error("Token de webhook inválido");
  }

  const pedidosPayload = extrairPedidosDoPayload(payload);
  const pedidosIds: string[] = [];

  for (const entrada of pedidosPayload) {
    const pedido = mapearPedido(entrada);
    const itensMapeados = await mapearItensPedido(pedido);
    const pedidoComMapeamento: PedidoIfood = {
      ...pedido,
      itens: itensMapeados,
    };
    await salvarPedido(pedidoComMapeamento, entrada);
    await registrarLogIntegracao(
      "ifood_webhook_pedido_recebido",
      {
        pedidoId: pedido.id,
        status: pedido.status,
        origem: pedido.origem,
        totalItens: itensMapeados.length,
        itensNaoMapeados: itensMapeados.filter((item) => !item.mapeado).length,
      },
      true
    );
    pedidosIds.push(pedido.id);
  }

  return {
    processados: pedidosIds.length,
    pedidosIds,
  };
}

function converterPedidoDoc(snapshot: FirebaseFirestore.DocumentSnapshot): PedidoIfood {
  if (!snapshot.exists) {
    throw new Error("Pedido não encontrado");
  }

  const dados = asRegistro(snapshot.data());
  return {
    id: snapshot.id,
    cliente: asTexto(dados.cliente),
    itens: normalizarItems(dados.itens),
    valor: asNumero(dados.valor),
    status: validarStatusPermitido(asTexto(dados.status || "pendente")),
    origem: "ifood",
    estoqueBaixado: Boolean(dados.estoqueBaixado),
  };
}

export async function aceitarPedidoIfood(pedidoId: string, usuarioId: string): Promise<Registro> {
  if (!pedidoId.trim()) {
    throw new Error("pedidoId é obrigatório");
  }

  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();
  const pedido = converterPedidoDoc(pedidoSnap);

  if (pedido.status !== "pendente") {
    throw new Error("Apenas pedidos pendentes podem ser aceitos");
  }

  const itensRemapeados = await mapearItensPedido(pedido);
  const pedidoAtualizado: PedidoIfood = {
    ...pedido,
    itens: itensRemapeados,
  };

  await atualizarEstoquePorPedido(pedidoAtualizado, usuarioId);
  await enviarPedidoParaCozinha({ ...pedidoAtualizado, status: "aceito", estoqueBaixado: true });

  const respostaIfood = await atualizarStatusNoIfoodExterno(pedidoAtualizado.id, "aceito");

  await pedidoRef.set(
    {
      status: "aceito",
      estoqueBaixado: true,
      itens: itensRemapeados,
      aceitoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: usuarioId,
    },
    { merge: true }
  );

  await registrarLogIntegracao("ifood_pedido_aceito", { pedidoId, usuarioId }, true);
  return respostaIfood;
}

export async function rejeitarPedidoIfood(pedidoId: string, usuarioId: string): Promise<Registro> {
  if (!pedidoId.trim()) {
    throw new Error("pedidoId é obrigatório");
  }

  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();
  const pedido = converterPedidoDoc(pedidoSnap);

  if (pedido.estoqueBaixado) {
    await devolverEstoquePedido(pedido, usuarioId);
  }

  const respostaIfood = await atualizarStatusNoIfoodExterno(pedido.id, "cancelado");

  await pedidoRef.set(
    {
      status: "cancelado",
      estoqueBaixado: false,
      canceladoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: usuarioId,
    },
    { merge: true }
  );

  await registrarLogIntegracao("ifood_pedido_rejeitado", { pedidoId, usuarioId }, true);
  return respostaIfood;
}

export async function atualizarStatusPedidoIfood(
  pedidoId: string,
  status: "preparando" | "saiu_entrega" | "entregue" | "cancelado",
  usuarioId: string
): Promise<Registro> {
  if (!pedidoId.trim()) {
    throw new Error("pedidoId é obrigatório");
  }

  const statusNormalizado = validarStatusPermitido(status);
  if (!["preparando", "saiu_entrega", "entregue", "cancelado"].includes(statusNormalizado)) {
    throw new Error("Status não permitido para atualização operacional");
  }

  const pedidoRef = db.collection("pedidos").doc(pedidoId);
  const pedidoSnap = await pedidoRef.get();
  const pedido = converterPedidoDoc(pedidoSnap);

  if (statusNormalizado === "cancelado" && pedido.estoqueBaixado) {
    await devolverEstoquePedido(pedido, usuarioId);
  }

  const respostaIfood = await atualizarStatusNoIfoodExterno(pedido.id, statusNormalizado);

  await pedidoRef.set(
    {
      status: statusNormalizado,
      estoqueBaixado: statusNormalizado === "cancelado" ? false : pedido.estoqueBaixado,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: usuarioId,
    },
    { merge: true }
  );

  await registrarLogIntegracao(
    "ifood_status_atualizado",
    { pedidoId, status: statusNormalizado, usuarioId },
    true
  );

  return respostaIfood;
}
