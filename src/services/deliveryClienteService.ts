import { signInAnonymously } from "firebase/auth";
import { Timestamp, collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";
import { criarPedidoDelivery } from "./backendService";
import { CheckoutDelivery, PedidoDelivery, ProdutoCardapio } from "../types/DeliveryCliente";
import { useDeliveryClienteStore } from "../store/useDeliveryClienteStore";
import { getPublicEmpresaId } from "./tenantService";

type Registro = Record<string, unknown>;

function asRegistro(value: unknown): Registro {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  return value as Registro;
}

function asTexto(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

function asIso(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return undefined;
}

function toProdutoCardapio(id: string, value: unknown): ProdutoCardapio {
  const dados = asRegistro(value);
  return {
    id,
    nome: asTexto(dados.nome),
    descricao: asTexto(dados.descricao),
    categoria: asTexto(dados.categoria) || "Geral",
    precoVenda: asNumero(dados.precoVenda || dados.preco),
    imagemUrl: asTexto(dados.imagemUrl || dados.foto),
    ativo: Boolean(dados.ativo),
    estoqueUnidades: asNumero(dados.estoqueUnidades),
    destaque: Boolean(dados.destaque),
  };
}

export async function garantirAuthClienteDelivery(): Promise<void> {
  if (auth.currentUser) {
    return;
  }

  await signInAnonymously(auth);
}

export function observarCardapioDelivery(callback: (produtos: ProdutoCardapio[]) => void): () => void {
  const empresaId = getPublicEmpresaId();
  const filtros = [where("ativo", "==", true)];

  if (empresaId) {
    filtros.push(where("empresaId", "==", empresaId));
  }

  const referencia = query(collection(db, "produtos"), ...filtros);

  return onSnapshot(referencia, (snapshot) => {
    const produtos = snapshot.docs
      .map((docSnap) => toProdutoCardapio(docSnap.id, docSnap.data()))
      .filter((produto) => produto.precoVenda > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome));

    callback(produtos);
  });
}

export async function obterProdutoDelivery(produtoId: string): Promise<ProdutoCardapio | null> {
  const empresaId = getPublicEmpresaId();
  const ref = doc(db, "produtos", produtoId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const produto = toProdutoCardapio(snapshot.id, snapshot.data());
  const dados = asRegistro(snapshot.data());

  if (empresaId && asTexto(dados.empresaId) !== empresaId) {
    return null;
  }

  if (!produto.ativo) {
    return null;
  }

  return produto;
}

export async function finalizarPedidoDelivery(checkout: CheckoutDelivery): Promise<{ pedidoId: string; total: number }> {
  await garantirAuthClienteDelivery();

  const estado = useDeliveryClienteStore.getState();
  const resposta = await criarPedidoDelivery({
    cliente: checkout.cliente,
    endereco: checkout.endereco,
    pagamento: checkout.pagamento,
    observacao: checkout.observacao || estado.observacaoGeral,
    itens: estado.itensCarrinho.map((item) => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      observacao: item.observacao,
    })),
  });

  const dados = asRegistro(resposta.data);
  return {
    pedidoId: asTexto(dados.pedidoId),
    total: asNumero(dados.total),
  };
}

export function observarPedidoDelivery(pedidoId: string, callback: (pedido: PedidoDelivery | null) => void): () => void {
  const referencia = doc(db, "pedidos", pedidoId);

  return onSnapshot(referencia, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const dados = asRegistro(snapshot.data());
    const itensRaw = Array.isArray(dados.itens) ? dados.itens : [];

    const pedido: PedidoDelivery = {
      id: snapshot.id,
      cliente: asTexto(dados.cliente),
      itens: itensRaw.map((item) => {
        const registro = asRegistro(item);
        return {
          produtoId: asTexto(registro.produtoId),
          nome: asTexto(registro.nome),
          quantidade: asNumero(registro.quantidade),
          precoUnitario: asNumero(registro.precoUnitario),
          observacao: asTexto(registro.observacao),
        };
      }),
      total: asNumero(dados.total),
      origem: asTexto(dados.origem) === "ifood" ? "ifood" : "delivery",
      status: (asTexto(dados.status) || "pendente") as PedidoDelivery["status"],
      criadoEmIso: asIso(dados.criadoEm) || asTexto(dados.criadoEmIso),
      atualizadoEm: asTexto(dados.atualizadoEm),
      tempoEstimadoMinutos: asNumero(dados.tempoEstimadoMinutos),
      observacao: asTexto(dados.observacao),
      pagamento: asRegistro(dados.pagamento) as PedidoDelivery["pagamento"],
      endereco: asRegistro(dados.endereco) as PedidoDelivery["endereco"],
    };

    callback(pedido);
  });
}
