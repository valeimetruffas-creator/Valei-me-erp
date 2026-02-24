import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense, type ComponentType } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PrivateRoute from "./routes/PrivateRoute";
import { iniciarFinanceiroIntegration } from "./services/FinanceiroIntegration";
import CartButton from "./components/CartButton";
import { useConfeitariaStore } from "./store/useConfeitariaStore";
import { useFinanceiroStore } from "./store/useFinanceiroStore";

const LoginPage = lazy(() => import("./pages/Login"));
const CadastroPage = lazy(() => import("./pages/Cadastro"));
const RecuperarSenhaPage = lazy(() => import("./pages/RecuperarSenha"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const OrcamentoPage = lazy(() => import("./pages/Orcamento"));
const CartPage = lazy(() => import("./pages/Cart"));
const EstoqueInsumosPage = lazy(() => import("./pages/EstoqueInsumos"));
const ComprasPage = lazy(() => import("./pages/Compras"));
const FinalizarVendaPage = lazy(() => import("./pages/FinalizarVenda"));
const FichaTecnicaPage = lazy(() => import("./pages/FichaTecnica"));
const ProducaoPage = lazy(() => import("./pages/Producao"));
const VendaPage = lazy(() => import("./pages/Venda"));
const ProdutosPage = lazy(() => import("./pages/Produtos"));
const FinanceiroPage = lazy(() => import("./pages/FinanceiroPage").then((mod) => ({ default: mod.FinanceiroPage })));
const ConfiguracoesPage = lazy(() => import("./pages/Configuracoes"));
const PainelPedidosPage = lazy(() => import("./pages/PainelPedidos"));
const ProdutosNaoMapeadosPage = lazy(() => import("./pages/ProdutosNaoMapeados"));

const ConfiguracoesMotoboysPage = lazy(() => import("./pages/configuracoes/ConfiguracoesMotoboys"));
const ConfiguracoesAutomacaoWhatsappPage = lazy(() => import("./pages/configuracoes/ConfiguracoesAutomacaoWhatsapp"));
const ConfiguracoesIntegracaoIfoodPage = lazy(() => import("./pages/configuracoes/ConfiguracoesIntegracaoIfood"));
const ConfiguracoesEmissaoNotaFiscalPage = lazy(() => import("./pages/configuracoes/ConfiguracoesEmissaoNotaFiscal"));
const ConfiguracoesImpressaoSegmentadaPage = lazy(() => import("./pages/configuracoes/ConfiguracoesImpressaoSegmentada"));
const ConfiguracoesCidadesEntregaPage = lazy(() => import("./pages/configuracoes/ConfiguracoesCidadesEntrega"));
const ConfiguracoesBloqueioClientePage = lazy(() => import("./pages/configuracoes/ConfiguracoesBloqueioCliente"));
const ConfiguracoesAutomacaoInstagramPage = lazy(() => import("./pages/configuracoes/ConfiguracoesAutomacaoInstagram"));
const ConfiguracoesMapaMesasPage = lazy(() => import("./pages/configuracoes/ConfiguracoesMapaMesas"));
const ConfiguracoesSugestaoImpressorasPage = lazy(() => import("./pages/configuracoes/ConfiguracoesSugestaoImpressoras"));
const ConfiguracoesIntegracoesApiAbertaPage = lazy(() => import("./pages/configuracoes/ConfiguracoesIntegracoesApiAberta"));
const ConfiguracoesIntegracaoParceirosPage = lazy(() => import("./pages/configuracoes/ConfiguracoesIntegracaoParceiros"));

const CardapioDeliveryPage = lazy(() => import("./pages/CardapioDelivery"));
const ClienteLojaPage = lazy(() => import("./pages/ClienteLoja"));
const ProdutoDeliveryPage = lazy(() => import("./pages/ProdutoDelivery"));
const CarrinhoDeliveryPage = lazy(() => import("./pages/CarrinhoDelivery"));
const CheckoutDeliveryPage = lazy(() => import("./pages/CheckoutDelivery"));
const PedidoDeliveryPage = lazy(() => import("./pages/PedidoDelivery"));

function FallbackTelaPublica() {
  return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
}

function renderLazy(Page: ComponentType) {
  return (
    <Suspense fallback={<FallbackTelaPublica />}>
      <Page />
    </Suspense>
  );
}

function Layout() {
  const location = useLocation();
  const exibirCarrinhoFlutuante = !["/venda", "/vendas", "/pdv"].includes(location.pathname);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6 pt-20 ml-56 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Botão do carrinho flutuante */}
      {exibirCarrinhoFlutuante && <CartButton />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    iniciarFinanceiroIntegration();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        useConfeitariaStore.getState().carregarDadosFirebase();
        await useFinanceiroStore.getState().carregarFirebase();
      }
    });

    return () => unsub();
  }, []);

  const router = createBrowserRouter([
    { path: "/login", element: renderLazy(LoginPage) },
    { path: "/cadastro", element: renderLazy(CadastroPage) },
    { path: "/recuperar-senha", element: renderLazy(RecuperarSenhaPage) },
    {
      path: "/cardapio",
      element: renderLazy(CardapioDeliveryPage),
    },
    {
      path: "/cliente/:empresaSlug",
      element: renderLazy(ClienteLojaPage),
    },
    {
      path: "/produto/:id",
      element: renderLazy(ProdutoDeliveryPage),
    },
    {
      path: "/carrinho",
      element: renderLazy(CarrinhoDeliveryPage),
    },
    {
      path: "/checkout",
      element: renderLazy(CheckoutDeliveryPage),
    },
    {
      path: "/pedido/:id",
      element: renderLazy(PedidoDeliveryPage),
    },
    {
      path: "/",
      element: (
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      ),
      children: [
        { index: true, element: renderLazy(DashboardPage) },
        { path: "estoque", element: renderLazy(EstoqueInsumosPage) },
        { path: "venda", element: renderLazy(VendaPage) },
        { path: "venda-debug", element: <Navigate to="/venda?debug=1" replace /> },
        { path: "sales", element: <Navigate to="/venda" replace /> },
        { path: "vendas", element: <Navigate to="/venda" replace /> },
        { path: "orcamento", element: renderLazy(OrcamentoPage) },
        { path: "carrinho", element: renderLazy(CartPage) },
        { path: "compras", element: renderLazy(ComprasPage) },
        { path: "finalizar-venda", element: renderLazy(FinalizarVendaPage) },
        { path: "fichatecnica", element: renderLazy(FichaTecnicaPage) },
        { path: "producao", element: renderLazy(ProducaoPage) },
        { path: "pdv", element: <Navigate to="/venda" replace /> },
        { path: "produtos", element: renderLazy(ProdutosPage) },
        { path: "financeiro", element: renderLazy(FinanceiroPage) },
        { path: "configuracoes", element: renderLazy(ConfiguracoesPage) },
        { path: "configuracoes/motoboys", element: renderLazy(ConfiguracoesMotoboysPage) },
        { path: "configuracoes/automacao-whatsapp", element: renderLazy(ConfiguracoesAutomacaoWhatsappPage) },
        { path: "configuracoes/integracao-ifood", element: renderLazy(ConfiguracoesIntegracaoIfoodPage) },
        { path: "configuracoes/emissao-nota-fiscal", element: renderLazy(ConfiguracoesEmissaoNotaFiscalPage) },
        { path: "configuracoes/impressao-segmentada", element: renderLazy(ConfiguracoesImpressaoSegmentadaPage) },
        { path: "configuracoes/cidades-entrega", element: renderLazy(ConfiguracoesCidadesEntregaPage) },
        { path: "configuracoes/bloqueio-cliente", element: renderLazy(ConfiguracoesBloqueioClientePage) },
        { path: "configuracoes/automacao-instagram", element: renderLazy(ConfiguracoesAutomacaoInstagramPage) },
        { path: "configuracoes/mapa-mesas", element: renderLazy(ConfiguracoesMapaMesasPage) },
        { path: "configuracoes/sugestao-impressoras", element: renderLazy(ConfiguracoesSugestaoImpressorasPage) },
        { path: "configuracoes/integracoes-api", element: renderLazy(ConfiguracoesIntegracoesApiAbertaPage) },
        { path: "configuracoes/integracao-parceiros", element: renderLazy(ConfiguracoesIntegracaoParceirosPage) },
        { path: "pedidos", element: renderLazy(PainelPedidosPage) },
        { path: "pedidos/nao-mapeados", element: renderLazy(ProdutosNaoMapeadosPage) },
      ],
    },
  ], {
    future: {
      v7_startTransition: true,
    },
  });

  return <RouterProvider router={router} />;
}
