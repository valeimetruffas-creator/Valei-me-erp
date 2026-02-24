import { useState, useMemo } from "react";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { FichaTecnica, ItemFicha, CategoriaFicha, TipoIngrediente } from "../types/FichaTecnica";
import { formatCurrencyBRL } from "../utils/formatCurrency";
import { safeNumber, safeFixed, getPrecoPorGrama, calcularCustoSeguro } from "../utils/safeNumbers";
import { theme } from "../styles/theme";

export default function FichaTecnicaPage() {
  const { fichas, insumos, addFicha, updateFicha, removeFicha } = useConfeitariaStore();
  const [nivelAtivo, setNivelAtivo] = useState<CategoriaFicha>("base");
  const [fichaSelecionada, setFichaSelecionada] = useState<FichaTecnica | null>(null);

  // ===== CÁLCULOS AUTOMÁTICOS EM TEMPO REAL =====
  const totais = useMemo(() => {
    if (!fichaSelecionada) return null;

    let custoTotal = 0;

    fichaSelecionada.itens.forEach(item => {
      if (!item.itemId || item.quantidade === undefined || item.quantidade === null || isNaN(Number(item.quantidade))) return;

      let custoUnitario = 0;

      if (item.tipo === "insumo") {
        const insumo = insumos.find(i => i.id === item.itemId);
        custoUnitario = getPrecoPorGrama(insumo || {});
      } else {
        const ficha = fichas.find(f => f.id === item.itemId);
        custoUnitario = safeNumber(ficha?.custoUnitario);
      }

      custoTotal += calcularCustoSeguro(item.quantidade, custoUnitario);
    });

    const custoUnitarioReceita = fichaSelecionada.rendimento > 0 ? custoTotal / fichaSelecionada.rendimento : 0;
    const precoVenda = custoUnitarioReceita * (1 + fichaSelecionada.margemLucro / 100);
    const lucroUnitario = precoVenda - custoUnitarioReceita;
    const faturamento = precoVenda * fichaSelecionada.rendimento;
    const lucroReceita = faturamento - custoTotal;

    return {
      custoTotal,
      custoUnitarioReceita,
      precoVenda,
      lucroUnitario,
      faturamento,
      lucroReceita
    };
  }, [fichaSelecionada, insumos, fichas]);

  // Filtrar fichas por nível
  const fichasFiltradas = fichas.filter(f => f.categoria === nivelAtivo);

  // Gerar opções de ingredientes baseado na categoria da ficha
  const gerarOpcoesIngredientes = (categoria: CategoriaFicha) => {
    const opcoes: Array<{ tipo: TipoIngrediente; id: string; nome: string; descricao?: string }> = [];

    // Helper seguro para obter preço unitário
    const getPrecoUnitario = (tipo: TipoIngrediente, id: string): number => {
      if (tipo === "insumo") {
        const insumo = insumos.find(i => i.id === id);
        return insumo?.precoPorGrama ?? 0;
      } else {
        const ficha = fichas.find(f => f.id === id);
        return ficha?.custoUnitario ?? 0;
      }
    };

    // BASE: só insumos
    if (categoria === "base") {
      return insumos.map(i => ({
        tipo: "insumo" as const,
        id: i.id,
        nome: i.nome,
        descricao: `R$ ${(i.precoPorGrama ?? 0).toFixed(4)}/g`
      }));
    }

    // RECHEIO: insumos + bases
    if (categoria === "recheio") {
      const bases = fichas.filter(f => f.categoria === "base");
      return [
        ...insumos.map(i => ({
          tipo: "insumo" as const,
          id: i.id,
          nome: `[INSUMO] ${i.nome}`,
          descricao: `R$ ${(i.precoPorGrama ?? 0).toFixed(4)}/g`
        })),
        ...bases.map(b => ({
          tipo: "base" as const,
          id: b.id,
          nome: `[BASE] ${b.nome}`,
          descricao: `R$ ${(b.custoUnitario ?? 0).toFixed(2)}/un`
        }))
      ];
    }

    // MONTAGEM: insumos + bases + recheios
    if (categoria === "montagem") {
      const bases = fichas.filter(f => f.categoria === "base");
      const recheios = fichas.filter(f => f.categoria === "recheio");
      return [
        ...insumos.map(i => ({
          tipo: "insumo" as const,
          id: i.id,
          nome: `[INSUMO] ${i.nome}`,
          descricao: `R$ ${(i.precoPorGrama ?? 0).toFixed(4)}/g`
        })),
        ...bases.map(b => ({
          tipo: "base" as const,
          id: b.id,
          nome: `[BASE] ${b.nome}`,
          descricao: `R$ ${(b.custoUnitario ?? 0).toFixed(2)}/un`
        })),
        ...recheios.map(r => ({
          tipo: "recheio" as const,
          id: r.id,
          nome: `[RECHEIO] ${r.nome}`,
          descricao: `R$ ${(r.custoUnitario ?? 0).toFixed(2)}/un`
        }))
      ];
    }

    return opcoes;
  };

  const novaFicha = () => {
    const ficha: FichaTecnica = {
      id: crypto.randomUUID(),
      nome: "Nova Ficha",
      categoria: nivelAtivo,
      rendimento: 1,
      itens: [],
      custoTotal: 0,
      custoUnitario: 0,
      precoVenda: 0,
      margemLucro: 30
    };
    addFicha(ficha);
    setFichaSelecionada(ficha);
  };

  const atualizarFicha = (ficha: FichaTecnica, campo: keyof FichaTecnica, valor: any) => {
    const atualizada = { ...ficha, [campo]: valor };
    setFichaSelecionada(atualizada);
  };

  const adicionarItem = (ficha: FichaTecnica) => {
    const atualizada = {
      ...ficha,
      itens: [...ficha.itens, { tipo: "insumo" as const, itemId: "", quantidade: 0 }]
    };
    setFichaSelecionada(atualizada);
  };

  const atualizarItem = (
    ficha: FichaTecnica,
    itemIndex: number,
    campo: keyof ItemFicha,
    valor: any
  ) => {
    const itensAtualizados = [...ficha.itens];
    itensAtualizados[itemIndex] = { ...itensAtualizados[itemIndex], [campo]: valor };
    const atualizada = { ...ficha, itens: itensAtualizados };
    setFichaSelecionada(atualizada);
  };

  const removerItem = (ficha: FichaTecnica, itemIndex: number) => {
    const atualizada = {
      ...ficha,
      itens: ficha.itens.filter((_, i) => i !== itemIndex)
    };
    setFichaSelecionada(atualizada);
  };

  const recalcularCustos = (ficha: FichaTecnica) => {
    const custoTotal = ficha.itens.reduce((total, item) => {
      if (item.tipo === "insumo") {
        const insumo = insumos.find(i => i.id === item.itemId);
        if (!insumo) return total;
        const custoPorGrama = insumo.precoPorGrama;
        const quantidade = safeNumber(item.quantidade);
        return total + (quantidade * custoPorGrama);
      } else if (item.tipo === "base" || item.tipo === "recheio") {
        const fichaRef = fichas.find(f => f.id === item.itemId);
        if (!fichaRef) return total;
        const quantidade = safeNumber(item.quantidade);
        return total + (quantidade * fichaRef.custoUnitario);
      }
      return total;
    }, 0);

    const custoUnitario = ficha.rendimento > 0 ? custoTotal / ficha.rendimento : 0;
    const precoVenda = custoUnitario * (1 + ficha.margemLucro / 100);

    const fichaAtualizada = {
      ...ficha,
      custoTotal,
      custoUnitario,
      precoVenda
    };

    setFichaSelecionada(fichaAtualizada);
    updateFicha(fichaAtualizada);
  };

  return (
    <div className="p-6 pt-20 min-h-screen" style={{ backgroundColor: theme.colors.primary }}>
      {/* MODO EDIÇÃO - Mostrar ficha grande */}
      {fichaSelecionada ? (
        <div>
          {/* Cabeçalho com botão fechar */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-4xl font-bold" style={{ color: theme.colors.primaryLight }}>
              📋 Editar Ficha Técnica
            </h1>
            <button
              onClick={() => setFichaSelecionada(null)}
              className="px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg text-white"
              style={{ backgroundColor: theme.colors.danger }}
            >
              ← Voltar à Lista
            </button>
          </div>

          {/* FICHA GIGANTE - Estrutura original */}
          <div
            key={fichaSelecionada.id}
            className="rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: theme.colors.background }}
          >
            {/* CABEÇALHO DA FICHA */}
            <div className="p-5" style={{
              backgroundImage: `linear-gradient(to right, ${theme.colors.primaryLight}, ${theme.colors.primaryDark})`
            }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1" style={{ color: theme.colors.primary }}>Nome do Produto</label>
                  <input
                    placeholder="Ex: Bolo de Chocolate"
                    value={fichaSelecionada.nome}
                    onChange={(e) => {
                      const atualizada = { ...fichaSelecionada, nome: e.target.value };
                      setFichaSelecionada(atualizada);
                    }}
                    className="w-full p-3 rounded-lg font-bold text-xl bg-white focus:outline-none focus:ring-2"
                    style={{
                      color: theme.colors.primary,
                      borderColor: theme.colors.primary,
                      borderWidth: '2px',
                      '--tw-ring-color': theme.colors.primaryDark
                    } as any}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: theme.colors.primary }}>Rendimento</label>
                    <input
                      type="number"
                      placeholder="Unidades"
                      value={fichaSelecionada.rendimento}
                      onChange={(e) => {
                        const atualizada = { ...fichaSelecionada, rendimento: Number(e.target.value) };
                        setFichaSelecionada(atualizada);
                      }}
                      className="w-full p-3 rounded-lg bg-white font-semibold focus:outline-none focus:ring-2"
                      style={{
                        color: theme.colors.primary,
                        borderColor: theme.colors.primary,
                        borderWidth: '2px',
                        '--tw-ring-color': theme.colors.primaryDark
                      } as any}
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: theme.colors.primary }}>Margem %</label>
                    <input
                      type="number"
                      placeholder="Lucro %"
                      value={fichaSelecionada.margemLucro}
                      onChange={(e) => {
                        const atualizada = { ...fichaSelecionada, margemLucro: Number(e.target.value) };
                        setFichaSelecionada(atualizada);
                      }}
                      className="w-full p-3 rounded-lg bg-white font-semibold focus:outline-none focus:ring-2"
                      style={{
                        color: theme.colors.primary,
                        borderColor: theme.colors.primary,
                        borderWidth: '2px',
                        '--tw-ring-color': theme.colors.primaryDark
                      } as any}
                      min={0}
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* LISTA DE INSUMOS */}
            <div className="p-5">
              <h3 className="text-lg font-bold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                <span className="text-white px-3 py-1 rounded-full mr-2" style={{ backgroundColor: theme.colors.primaryDark }}>
                  {fichaSelecionada.itens.length}
                </span>
                Insumos da Receita
              </h3>

              <div className="space-y-2">
                {fichaSelecionada.itens.map((item, itemIdx) => {
                  const opcoesDisponíveis = gerarOpcoesIngredientes(fichaSelecionada.categoria);
                  const opcaoSelecionada = opcoesDisponíveis.find(o => o.id === item.itemId);
                  
                 let custo = 0;

if (item.tipo === "insumo") {
  const insumo = insumos.find(i => i.id === item.itemId);
  custo = getPrecoPorGrama(insumo || {});
} else {
  const fichaRef = fichas.find(f => f.id === item.itemId);
  custo = safeNumber(fichaRef?.custoUnitario);
}

const custoItem = calcularCustoSeguro(item.quantidade, custo);


                  return (
                    <div
                      key={itemIdx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border-2 border-gray-200 transition"
                      style={{ '--tw-border-opacity': '1', borderColor: theme.colors.border } as any}
                    >
                      <select
                        value={item.itemId}
                        onChange={(e) => {
                          const opcao = opcoesDisponíveis.find(o => o.id === e.target.value);
                          if (opcao) {
                            const itensAtualizados = [...fichaSelecionada.itens];
                            itensAtualizados[itemIdx] = {
                              tipo: opcao.tipo,
                              itemId: opcao.id,
                              quantidade: item.quantidade
                            };
                            const atualizada = { ...fichaSelecionada, itens: itensAtualizados };
                            setFichaSelecionada(atualizada);
                          }
                        }}
                        className="md:col-span-4 p-2 rounded border-2 border-gray-300 focus:outline-none font-medium"
                        style={{
                          color: theme.colors.primary,
                          '--tw-border-opacity': '1'
                        } as any}
                      >
                        <option value="">Selecione o ingrediente</option>
                        {opcoesDisponíveis.map((opcao) => (
                          <option key={`${opcao.tipo}-${opcao.id}`} value={opcao.id}>
                            {opcao.nome} {opcao.descricao ? `| ${opcao.descricao}` : ""}
                          </option>
                        ))}
                      </select>

                      <div className="md:col-span-2">
                        <input
                          type="number"
                          placeholder={item.tipo === "insumo" ? "Qtd (g)" : "Qtd (un)"}
                          value={item.quantidade ?? ""}
                          onChange={(e) => atualizarItem(fichaSelecionada, itemIdx, "quantidade", safeNumber(Number(e.target.value)))}
                          className="w-full p-2 rounded border-2 border-gray-300 focus:outline-none font-semibold"
                          style={{
                            color: theme.colors.primary,
                            '--tw-border-opacity': '1'
                          } as any}
                          min={0}
                          step={0.1}
                        />
                      </div>

                      <div className="md:col-span-2 text-center">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <div className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                            R$ {safeFixed(custoItem || 0, 2)}
                          </div>
                          {opcaoSelecionada && (
                            <div className="text-xs text-gray-500">
                              R$ {safeFixed(custo || 0, 4)}/{item.tipo === "insumo" ? "g" : "un"}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 text-center">
                        {opcaoSelecionada && item.quantidade > 0 && (
                          <div className="text-sm">
                            <span className="font-bold px-2 py-1 rounded text-white" style={{ backgroundColor: theme.colors.primaryDark }}>
                              {item.tipo === "insumo" ? "🧂" : item.tipo === "base" ? "🥛" : "🍓"}
                              {item.tipo.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removerItem(fichaSelecionada, itemIdx)}
                        className="md:col-span-2 p-2 text-white rounded-lg hover:opacity-90 transition font-semibold"
                        style={{ backgroundColor: theme.colors.danger }}
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => adicionarItem(fichaSelecionada)}
                className="mt-4 px-4 py-2 rounded-lg text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.colors.primaryDark
                }}
                disabled={insumos.length === 0}
              >
                + Adicionar Insumo
              </button>
            </div>

            {/* PAINEL FINANCEIRO */}
            <div className="p-5" style={{
              backgroundImage: `linear-gradient(to bottom right, ${theme.colors.primaryDark}, ${theme.colors.primaryDark})`
            }}>
              <h3 className="text-xl font-bold mb-4 text-center" style={{ color: theme.colors.background }}>
                💰 ANÁLISE FINANCEIRA
              </h3>

              {totais && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="text-sm text-gray-600 font-semibold mb-1">Custo Total da Receita</div>
                      <div className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                        R$ {safeFixed(totais.custoTotal, 2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {fichaSelecionada.itens.length} insumo(s)
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="text-sm text-gray-600 font-semibold mb-1">Custo Unitário</div>
                      <div className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                        R$ {safeFixed(totais.custoUnitarioReceita, 2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {fichaSelecionada.rendimento} unidade(s)
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 shadow-lg border-2 border-green-500">
                      <div className="text-sm text-green-700 font-semibold mb-1">Preço de Venda</div>
                      <div className="text-3xl font-bold text-green-700">
                        R$ {safeFixed(totais.precoVenda, 2)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Margem: {safeFixed(fichaSelecionada.margemLucro, 1)}%
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 shadow-lg border-2 border-blue-500">
                      <div className="text-sm text-blue-700 font-semibold mb-1">Lucro Unitário</div>
                      <div className="text-3xl font-bold text-blue-700">
                        R$ {safeFixed(totais.lucroUnitario, 2)}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Real: {safeFixed((totais.lucroUnitario / totais.custoUnitarioReceita) * 100, 1)}%
                      </div>
                    </div>
                  </div>

                  {/* RESUMO ADICIONAL */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3" style={{ color: theme.colors.background }}>
                    <div className="bg-black bg-opacity-20 rounded p-3 text-center">
                      <div className="text-sm font-semibold">Lucro por Receita</div>
                      <div className="text-2xl font-bold">
                        R$ {safeFixed(totais.lucroReceita, 2)}
                      </div>
                    </div>

                    <div className="bg-black bg-opacity-20 rounded p-3 text-center">
                      <div className="text-sm font-semibold">Faturamento (1 receita)</div>
                      <div className="text-2xl font-bold">
                        R$ {safeFixed(totais.faturamento, 2)}
                      </div>
                    </div>

                    <div className="bg-black bg-opacity-20 rounded p-3 text-center">
                      <div className="text-sm font-semibold">ROI</div>
                      <div className="text-2xl font-bold">
                        {totais.custoTotal > 0 ? safeFixed((totais.lucroReceita / totais.custoTotal) * 100, 1) : 0}%
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RODAPÉ COM AÇÕES */}
            <div className="p-4 bg-gray-100 flex gap-2">
              <button
                onClick={() => {
                  if (totais) {
                    const fichaConfirmada = {
                      ...fichaSelecionada,
                      custoTotal: totais.custoTotal,
                      custoUnitario: totais.custoUnitarioReceita,
                      precoVenda: totais.precoVenda
                    };
                    updateFicha(fichaConfirmada);
                  }
                }}
                className="px-4 py-2 text-white rounded-lg transition font-semibold hover:opacity-90"
                style={{ backgroundColor: theme.colors.primaryDark }}
              >
                💾 Salvar Ficha
              </button>

              <button
                onClick={() => {
                  removeFicha(fichaSelecionada.id);
                  setFichaSelecionada(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Excluir Ficha
              </button>

              <button
                onClick={() => {
                  const fichaJSON = JSON.stringify(fichaSelecionada, null, 2);
                  console.log("Ficha Técnica:", fichaJSON);
                  alert("Ficha salva! (Verifique o console para detalhes)");
                }}
                className="px-4 py-2 text-white rounded-lg transition font-semibold hover:opacity-90"
                style={{ backgroundColor: theme.colors.danger }}
              >
                Verificar Dados
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MODO LISTA - Mostrar botões de nível e lista de fichas */
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-4xl font-bold" style={{ color: theme.colors.primaryLight }}>
              📋 Ficha Técnica
            </h1>
            <button
              onClick={novaFicha}
              className="px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg"
              style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
            >
              + Nova Ficha Técnica
            </button>
          </div>

          {/* BOTÕES DE NÍVEL */}
          <div className="mb-6 flex gap-3 justify-center">
            {(["base", "recheio", "montagem"] as const).map((nivel) => (
              <button
                key={nivel}
                onClick={() => setNivelAtivo(nivel)}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition shadow-lg ${
                  nivelAtivo === nivel
                    ? "transform scale-105 shadow-2xl"
                    : "hover:opacity-90 opacity-70"
                }`}
                style={{
                  backgroundColor: nivelAtivo === nivel ? theme.colors.primaryLight : theme.colors.background,
                  color: nivelAtivo === nivel ? theme.colors.primary : theme.colors.primaryLight,
                  borderWidth: "2px",
                  borderColor: theme.colors.primaryLight
                }}
              >
                {nivel === "base" && "🥛 BASE"}
                {nivel === "recheio" && "🍓 RECHEIO"}
                {nivel === "montagem" && "🧁 MONTAGEM"}
              </button>
            ))}
          </div>

          {insumos.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
              <p className="font-semibold">⚠️ Atenção!</p>
              <p>Nenhum insumo cadastrado. Cadastre insumos primeiro para criar fichas técnicas.</p>
            </div>
          )}

          {/* LISTA DE FICHAS EM FAIXAS */}
          <div className="space-y-3">
            {fichasFiltradas.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-2xl font-semibold" style={{ color: theme.colors.background }}>
                  Nenhuma ficha no nível {nivelAtivo}
                </p>
                <p className="mt-2" style={{ color: theme.colors.primaryLight }}>
                  Clique em "Nova Ficha Técnica" para começar
                </p>
              </div>
            ) : (
              fichasFiltradas.map((ficha) => (
                <div
                  key={ficha.id}
                  className="rounded-lg shadow-lg p-4 cursor-pointer transition hover:shadow-2xl hover:scale-105"
                  style={{ backgroundColor: theme.colors.background }}
                  onClick={() => setFichaSelecionada(ficha)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Nome */}
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">NOME</div>
                      <div className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                        {ficha.nome}
                      </div>
                    </div>

                    {/* Rendimento */}
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">RENDIMENTO</div>
                      <div className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                        {ficha.rendimento} un.
                      </div>
                    </div>

                    {/* Insumos */}
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">INSUMOS</div>
                      <div className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                        {ficha.itens.length}
                      </div>
                    </div>

                    {/* Custo Total */}
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">CUSTO TOTAL</div>
                      <div className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                        R$ {safeFixed(ficha.custoTotal, 2)}
                      </div>
                    </div>

                    {/* Botão Editar */}
                    <div className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFichaSelecionada(ficha);
                        }}
                        className="px-6 py-2 rounded-lg font-bold transition hover:opacity-90 text-white"
                        style={{ backgroundColor: theme.colors.primaryDark }}
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
