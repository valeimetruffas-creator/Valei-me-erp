import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { listarProdutosFinais, ProdutoFinal } from "../services/produtoFinalService";
import { registrarVendaSegura } from "../services/vendaSeguraService";
import CupomFiscalService from "../services/cupomFiscalService";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import {
  ClienteVenda,
  ItemVendaPadrao,
  OrigemVenda,
  TipoVenda,
} from "../types/Venda";
import { VendaCarrinho } from "../components/venda/VendaCarrinho";
import { VendaCliente } from "../components/venda/VendaCliente";
import { VendaManual } from "../components/venda/VendaManual";
import { VendaProdutoBusca } from "../components/venda/VendaProdutoBusca";
import { VendaProdutosGrid } from "../components/venda/VendaProdutosGrid";
import { VendaResumo } from "../components/venda/VendaResumo";
import {
  formatMoneyBR,
  normalizarItemVenda,
  toNumber,
} from "../utils/vendaCalculos";

type ModoVendaTela = TipoVenda;

type ProdutoServidor = {
  produtoId: string;
  quantidade: number;
};

type NovoItemManual = {
  nome: string;
  quantidade: number;
  precoUnitario: number;
};

interface VendaProps {
  modoInicial?: ModoVendaTela;
}

export default function Venda({ modoInicial = "pdv" }: VendaProps) {
  const [modo, setModo] = useState<ModoVendaTela>(modoInicial);
  const [origemVenda, setOrigemVenda] = useState<OrigemVenda>("sistema");
  const [itens, setItens] = useState<ItemVendaPadrao[]>([]);
  const [cliente, setCliente] = useState<ClienteVenda | null>(null);
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);
  const [produtosFinaisPDV, setProdutosFinaisPDV] = useState<ProdutoFinal[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);

  const { produtos } = useConfeitariaStore();

  useEffect(() => {
    setCarregandoProdutos(true);

    const produtosCarregados = listarProdutosFinais().filter((produto) => {
      const produtoComAtivo = produto as ProdutoFinal & { ativo?: boolean };
      return produtoComAtivo.ativo !== false;
    });

    setProdutosFinaisPDV(produtosCarregados);
    setCarregandoProdutos(false);
  }, []);

  const produtosPDV = useMemo(() => {
    const produtosCadastro = produtos
      .filter((produto) => produto.ativo !== false)
      .map<ProdutoFinal>((produto) => ({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria || "Produto",
        componentes: [],
        precoVenda: toNumber(produto.precoVenda),
      }));

    const mapaPorId = new Map<string, ProdutoFinal>();

    for (const produto of produtosCadastro) {
      mapaPorId.set(produto.id, produto);
    }

    for (const produto of produtosFinaisPDV) {
      mapaPorId.set(produto.id, produto);
    }

    return Array.from(mapaPorId.values()).filter((produto) => toNumber(produto.precoVenda) >= 0);
  }, [produtos, produtosFinaisPDV]);

  const normalizarListaItens = (lista: ItemVendaPadrao[]) =>
    lista.map((item) => normalizarItemVenda(item));

  const itensCalculados = useMemo(() => normalizarListaItens(itens), [itens]);

  const subtotalItens = useMemo(() => {
    return itensCalculados.reduce(
      (acc, item) => acc + (toNumber(item.quantidade) * toNumber(item.precoUnitario)),
      0
    );
  }, [itensCalculados]);

  const total = useMemo(() => {
    return subtotalItens - toNumber(desconto) + toNumber(acrescimo);
  }, [subtotalItens, desconto, acrescimo]);

  function recalcularItem(
    item: Omit<ItemVendaPadrao, "subtotal"> & { subtotal?: number }
  ): ItemVendaPadrao {
    return normalizarItemVenda(item);
  }

  function buscarProdutoPorNome(nome: string): string | undefined {
    return produtos.find(
      (produto) => produto.nome.trim().toLowerCase() === nome.trim().toLowerCase()
    )?.id;
  }

  function adicionarProdutoPDV(produto: ProdutoFinal) {
    setItens((prev) => {
      const existente = prev.find((item) => item.produtoId === produto.id);

      if (existente) {
        return normalizarListaItens(prev.map((item) =>
          item.id === existente.id
            ? recalcularItem({ ...item, quantidade: toNumber(item.quantidade) + 1 })
            : item
        ));
      }

      return normalizarListaItens([
        ...prev,
        recalcularItem({
          id: produto.id,
          produtoId: produto.id,
          nome: produto.nome,
          quantidade: 1,
          precoUnitario: produto.precoVenda,
        }),
      ]);
    });
  }

  function alterarQuantidade(id: string, quantidade: number) {
    const quantidadeNumerica = toNumber(quantidade);

    if (quantidadeNumerica <= 0) {
      removerItem(id);
      return;
    }

    setItens((prev) =>
      normalizarListaItens(prev.map((item) =>
        item.id === id ? recalcularItem({ ...item, quantidade: quantidadeNumerica }) : item
      ))
    );
  }

  function removerItem(id: string) {
    setItens((prev) => normalizarListaItens(prev.filter((item) => item.id !== id)));
  }

  function aumentarQuantidade(id: string) {
    setItens((prev) =>
      normalizarListaItens(prev.map((item) =>
        item.id === id
          ? recalcularItem({ ...item, quantidade: toNumber(item.quantidade) + 1 })
          : item
      ))
    );
  }

  function diminuirQuantidade(id: string) {
    setItens((prev) => {
      const itemAtual = prev.find((item) => item.id === id);
      if (!itemAtual) {
        return prev;
      }

      const proximaQuantidade = toNumber(itemAtual.quantidade) - 1;
      if (proximaQuantidade <= 0) {
        return normalizarListaItens(prev.filter((item) => item.id !== id));
      }

      return normalizarListaItens(prev.map((item) =>
        item.id === id
          ? recalcularItem({ ...item, quantidade: proximaQuantidade })
          : item
      ));
    });
  }

  function adicionarItemManual(novoItem: NovoItemManual) {
    if (!novoItem.nome.trim() || novoItem.quantidade <= 0 || novoItem.precoUnitario < 0) {
      toast.error("Preencha item manual com nome, quantidade e preço válidos");
      return;
    }

    setItens((prev) =>
      normalizarListaItens([
        ...prev,
        recalcularItem({
          id: crypto.randomUUID(),
          nome: novoItem.nome,
          quantidade: novoItem.quantidade,
          precoUnitario: novoItem.precoUnitario,
          produtoId: buscarProdutoPorNome(novoItem.nome),
        }),
      ])
    );
  }

  function editarItemManual(id: string, itemEditado: NovoItemManual) {
    if (!itemEditado.nome.trim() || itemEditado.quantidade <= 0 || itemEditado.precoUnitario < 0) {
      toast.error("Dados inválidos para editar o item");
      return;
    }

    setItens((prev) =>
      normalizarListaItens(prev.map((item) =>
        item.id === id
          ? recalcularItem({
              ...item,
              nome: itemEditado.nome,
              quantidade: itemEditado.quantidade,
              precoUnitario: itemEditado.precoUnitario,
              produtoId: buscarProdutoPorNome(itemEditado.nome),
            })
          : item
      ))
    );
  }

  function aplicarDescontoPercentual(percentual: number) {
    const valor = subtotalItens * (percentual / 100);
    setDesconto(Number(valor.toFixed(2)));
  }

  function limparVenda() {
    setItens([]);
    setCliente(null);
    setDesconto(0);
    setAcrescimo(0);
  }

  function montarProdutosServidor(): ProdutoServidor[] {
    return itensCalculados
      .map((item) => ({
        ...item,
        quantidade: toNumber(item.quantidade),
      }))
      .filter((item) => Boolean(item.produtoId))
      .map((item) => ({
        produtoId: item.produtoId as string,
        quantidade: item.quantidade,
      }));
  }

  async function finalizarVenda() {
    if (itensCalculados.length === 0) {
      toast.error("Nenhum item na venda");
      return;
    }

    if ((modo === "completo" || modo === "delivery") && (!cliente || !cliente.nome.trim())) {
      toast.error("Cliente é obrigatório no modo completo");
      return;
    }

    const produtosServidor = montarProdutosServidor();

    if (produtosServidor.length === 0) {
      toast.error("Adicione ao menos 1 produto cadastrado para registrar a venda segura");
      return;
    }

    const tipoVenda: TipoVenda = modo;

    const payloadVenda = {
      itens: itensCalculados.map((item) => ({
        ...item,
        subtotal: toNumber(item.quantidade) * toNumber(item.precoUnitario),
      })),
      cliente,
      desconto,
      acrescimo,
      total,
      tipoVenda,
      origemVenda,
      data: new Date(),
    };

    try {
      const nomeCliente =
        cliente?.nome.trim() || (modo === "pdv" ? "Balcão PDV" : "Cliente não informado");

      const resposta = await registrarVendaSegura(produtosServidor, nomeCliente, desconto);

      if (modo === "completo") {
        const cupom = CupomFiscalService.criarCupomFiscal({
          itens: payloadVenda.itens.map((item) => ({
            descricao: item.nome,
            quantidade: item.quantidade,
            valorUnitario: item.precoUnitario,
            valorTotal: item.subtotal,
          })),
          desconto: payloadVenda.desconto > 0 ? payloadVenda.desconto : undefined,
          acrescimo: payloadVenda.acrescimo > 0 ? payloadVenda.acrescimo : undefined,
          formaPagamento: "dinheiro",
          vendaId: resposta?.vendaId,
        });

        useConfeitariaStore.getState().registrarCupomFiscal(cupom);
      }

      toast.success(`Venda concluída! Total: R$ ${formatMoneyBR(Number(resposta?.total || total))}`);
      limparVenda();
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error ? erro.message : "Falha ao registrar venda";
      toast.error(mensagem);
    }
  }

  return (
    <div className="min-h-screen bg-[#784E23] text-[#FDEDD2] p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#676C3C]">Venda Unificada</h1>

        <div className="flex flex-col md:flex-row gap-2">
          <select
            value={modo}
            onChange={(e) => setModo(e.target.value as ModoVendaTela)}
            className="text-black p-2 rounded"
          >
            <option value="pdv">Venda Rápida (PDV)</option>
            <option value="completo">Venda Completa</option>
            <option value="delivery">Delivery</option>
          </select>

          <select
            value={origemVenda}
            onChange={(e) => setOrigemVenda(e.target.value as OrigemVenda)}
            className="text-black p-2 rounded"
          >
            <option value="sistema">Origem: Sistema</option>
            <option value="ifood">Origem: iFood</option>
            <option value="site">Origem: Site</option>
          </select>

        </div>
      </div>

      {modo === "pdv" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <VendaProdutoBusca
              produtos={produtosPDV}
              loading={carregandoProdutos}
              onAdicionar={adicionarProdutoPDV}
            />

            <VendaProdutosGrid produtos={produtosPDV} onAdicionar={adicionarProdutoPDV} />
          </div>

          <VendaCarrinho
            itens={itensCalculados}
            onAumentar={aumentarQuantidade}
            onDiminuir={diminuirQuantidade}
            onRemover={removerItem}
            onAlterarQuantidade={alterarQuantidade}
          />
        </div>
      ) : (
        <VendaManual
          itens={itensCalculados}
          onAdicionar={adicionarItemManual}
          onEditar={editarItemManual}
          onRemover={removerItem}
        />
      )}

      <VendaCliente
        cliente={cliente}
        obrigatorio={modo === "completo"}
        onChange={setCliente}
      />

      <VendaResumo
        itens={itensCalculados}
        subtotal={subtotalItens}
        desconto={toNumber(desconto)}
        acrescimo={toNumber(acrescimo)}
        total={total}
        onChangeDesconto={(valor) => setDesconto(toNumber(valor))}
        onChangeAcrescimo={(valor) => setAcrescimo(toNumber(valor))}
        onAplicarDescontoPercentual={aplicarDescontoPercentual}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={finalizarVenda}
          className="bg-[#CDA85B] text-black font-bold px-4 py-2 rounded hover:opacity-90"
        >
          Finalizar Venda
        </button>

        <button
          type="button"
          onClick={limparVenda}
          className="bg-[#676C3C] text-[#FDEDD2] px-4 py-2 rounded hover:opacity-90"
        >
          Nova Venda
        </button>
      </div>
    </div>
  );
}
