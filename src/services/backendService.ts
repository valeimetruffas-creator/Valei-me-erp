// src/services/backendService.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// 🔒 Venda segura (backend)
export const registrarVendaSegura = httpsCallable(functions, "registrarVendaSegura");

// 🔒 Compra segura
export const registrarCompraSegura = httpsCallable(functions, "registrarCompraSegura");
export const cancelarCompraSegura = httpsCallable(functions, "cancelarCompraSegura");
export const editarCompraSegura = httpsCallable(functions, "editarCompraSegura");

// 🔒 Produção segura
export const registrarProducaoSegura = httpsCallable(functions, "registrarProducaoSegura");

// 🔒 Integração iFood - sincronização de produtos
export const sincronizarProdutosIfood = httpsCallable(functions, "sincronizarProdutosIfood");

// 🔒 Integração iFood - fluxo de pedidos (sempre validado no backend)
export const aceitarPedidoIfood = httpsCallable(functions, "aceitarPedidoIfood");
export const rejeitarPedidoIfood = httpsCallable(functions, "rejeitarPedidoIfood");
export const atualizarStatusPedidoIfood = httpsCallable(functions, "atualizarStatusPedidoIfood");
export const atualizarStatusPedido = httpsCallable(functions, "atualizarStatusPedido");
export const baixarEstoque = httpsCallable(functions, "baixarEstoque");
export const restaurarEstoqueCancelamento = httpsCallable(functions, "restaurarEstoqueCancelamento");
export const vincularProdutoNaoMapeadoIfood = httpsCallable(functions, "vincularProdutoNaoMapeadoIfood");
export const migrarMapeamentoProdutosIfood = httpsCallable(functions, "migrarMapeamentoProdutosIfood");

// 🔒 Delivery cliente
export const criarPedidoDelivery = httpsCallable(functions, "criarPedidoDelivery");
