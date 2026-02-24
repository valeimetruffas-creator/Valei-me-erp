import { memo, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useFinanceiroStore } from "../store/useFinanceiroStore";
import { theme } from "../styles/theme";

type FilterPeriodo = "hoje" | "semana" | "mes";

export function FinanceiroPage() {
  const transacoes = useFinanceiroStore((state) => state.transacoes);
  const saldo = useFinanceiroStore((state) => state.saldo);
  const [filterPeriodo, setFilterPeriodo] = useState<FilterPeriodo>("mes");

  const dados = useMemo(() => {
    const hoje = new Date();
    const inicio = new Date();

    if (filterPeriodo === "hoje") {
      inicio.setHours(0, 0, 0, 0);
    } else if (filterPeriodo === "semana") {
      const dia = hoje.getDay();
      inicio.setDate(hoje.getDate() - dia);
      inicio.setHours(0, 0, 0, 0);
    } else {
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
    }

    const transacoesPeriodo = transacoes.filter((t) => new Date(t.data) >= inicio);

    const receitasPeriodo = transacoesPeriodo.filter((t) => t.tipo === "entrada");
    const despesasPeriodo = transacoesPeriodo.filter((t) => t.tipo === "saida" || t.tipo === "despesa");

    const receita = receitasPeriodo.reduce((sum, t) => sum + Number(t.valor || 0), 0);
    const despesas = despesasPeriodo.reduce((sum, t) => sum + Number(t.valor || 0), 0);
    const lucro = receita - despesas;

    const resumoOrigem = {
      pdv: 0,
      delivery: 0,
      ifood: 0,
    };

    receitasPeriodo.forEach((t) => {
      const origem = String((t as { origem?: string }).origem ?? "pdv").toLowerCase();
      if (origem === "delivery") {
        resumoOrigem.delivery += Number(t.valor || 0);
        return;
      }
      if (origem === "ifood") {
        resumoOrigem.ifood += Number(t.valor || 0);
        return;
      }
      resumoOrigem.pdv += Number(t.valor || 0);
    });

    // Transações organizadas por data
    const todasTransacoes = [...transacoesPeriodo].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    // Dados para gráfico de entradas x saídas
    const entradaSaida: Record<string, { entrada: number; saida: number }> = {};
    
    transacoesPeriodo.forEach((t) => {
      const chave = new Date(t.data).toLocaleDateString("pt-BR");
      if (!entradaSaida[chave]) entradaSaida[chave] = { entrada: 0, saida: 0 };

      if (t.tipo === "entrada") {
        entradaSaida[chave].entrada += Number(t.valor || 0);
      } else {
        entradaSaida[chave].saida += Number(t.valor || 0);
      }
    });

    const dadosGraficoEntradaSaida = Object.entries(entradaSaida)
      .map(([dia, valores]) => ({ dia, ...valores }))
      .sort((a, b) => {
        const dataA = new Date(a.dia.split('/').reverse().join('-')).getTime();
        const dataB = new Date(b.dia.split('/').reverse().join('-')).getTime();
        return dataA - dataB;
      });

    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const transacoesHoje = transacoes.filter((t) => new Date(t.data) >= hojeInicio);
    const receitaHoje = transacoesHoje
      .filter((t) => t.tipo === "entrada")
      .reduce((sum, t) => sum + Number(t.valor || 0), 0);
    const despesaHoje = transacoesHoje
      .filter((t) => t.tipo === "saida" || t.tipo === "despesa")
      .reduce((sum, t) => sum + Number(t.valor || 0), 0);

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const transacoesMes = transacoes.filter((t) => new Date(t.data) >= inicioMes);
    const receitaMes = transacoesMes
      .filter((t) => t.tipo === "entrada")
      .reduce((sum, t) => sum + Number(t.valor || 0), 0);
    const despesaMes = transacoesMes
      .filter((t) => t.tipo === "saida" || t.tipo === "despesa")
      .reduce((sum, t) => sum + Number(t.valor || 0), 0);

    const dre = {
      receitaBruta: receitaMes,
      despesasOperacionais: despesaMes,
      lucroLiquido: receitaMes - despesaMes,
      margemLiquida: receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes) * 100 : 0,
    };

    return {
      saldoCaixa: saldo,
      receita,
      despesas,
      lucro,
      resumoOrigem,
      resumoDiario: {
        receita: receitaHoje,
        despesas: despesaHoje,
        resultado: receitaHoje - despesaHoje,
      },
      resumoMensal: {
        receita: receitaMes,
        despesas: despesaMes,
        resultado: receitaMes - despesaMes,
      },
      dre,
      todasTransacoes,
      dadosGraficoEntradaSaida,
    };
  }, [transacoes, saldo, filterPeriodo]);

  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      {/* Cabeçalho */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
          💰 Gestão Financeira
        </h1>
        <p style={{ color: theme.colors.background }}>
          Controle completo de receitas, despesas e lucratividade
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8 flex gap-4">
        {(["hoje", "semana", "mes"] as const).map((periodo) => (
          <button
            key={periodo}
            onClick={() => setFilterPeriodo(periodo)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filterPeriodo === periodo
                ? "scale-105 shadow-lg"
                : "opacity-70 hover:opacity-90"
            }`}
            style={{
              backgroundColor: filterPeriodo === periodo ? theme.colors.primaryLight : theme.colors.background,
              color: filterPeriodo === periodo ? theme.colors.primary : theme.colors.border,
            }}
          >
            <Filter size={16} className="inline mr-2" />
            {periodo === "hoje" && "Hoje"}
            {periodo === "semana" && "Semana"}
            {periodo === "mes" && "Mês"}
          </button>
        ))}
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <SummaryCard
          title="Saldo em Caixa"
          value={`R$ ${dados.saldoCaixa.toFixed(2)}`}
          icon={<DollarSign size={32} />}
          cor={theme.colors.primaryLight}
        />
        <SummaryCard
          title="Receita"
          value={`R$ ${dados.receita.toFixed(2)}`}
          icon={<TrendingUp size={32} />}
          cor={theme.colors.success}
        />
        <SummaryCard
          title="Despesas"
          value={`R$ ${dados.despesas.toFixed(2)}`}
          icon={<TrendingDown size={32} />}
          cor={theme.colors.danger}
        />
        <SummaryCard
          title="Lucro Líquido"
          value={`R$ ${dados.lucro.toFixed(2)}`}
          icon={<TrendingUp size={32} />}
          cor={dados.lucro >= 0 ? theme.colors.success : theme.colors.danger}
        />
      </div>

      {/* Receita por origem */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <SummaryCard
          title="Receita PDV"
          value={`R$ ${dados.resumoOrigem.pdv.toFixed(2)}`}
          icon={<DollarSign size={24} />}
          cor={theme.colors.info}
        />
        <SummaryCard
          title="Receita Delivery"
          value={`R$ ${dados.resumoOrigem.delivery.toFixed(2)}`}
          icon={<DollarSign size={24} />}
          cor={theme.colors.success}
        />
        <SummaryCard
          title="Receita iFood"
          value={`R$ ${dados.resumoOrigem.ifood.toFixed(2)}`}
          icon={<DollarSign size={24} />}
          cor={theme.colors.warning}
        />
      </div>

      {/* Resumos diário/mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: theme.colors.background }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary }}>
            📅 Resumo diário
          </h2>
          <p style={{ color: theme.colors.border }}>Receita: R$ {dados.resumoDiario.receita.toFixed(2)}</p>
          <p style={{ color: theme.colors.border }}>Despesas: R$ {dados.resumoDiario.despesas.toFixed(2)}</p>
          <p className="font-bold mt-2" style={{ color: dados.resumoDiario.resultado >= 0 ? theme.colors.success : theme.colors.danger }}>
            Resultado: R$ {dados.resumoDiario.resultado.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: theme.colors.background }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary }}>
            🗓️ Resumo mensal
          </h2>
          <p style={{ color: theme.colors.border }}>Receita: R$ {dados.resumoMensal.receita.toFixed(2)}</p>
          <p style={{ color: theme.colors.border }}>Despesas: R$ {dados.resumoMensal.despesas.toFixed(2)}</p>
          <p className="font-bold mt-2" style={{ color: dados.resumoMensal.resultado >= 0 ? theme.colors.success : theme.colors.danger }}>
            Resultado: R$ {dados.resumoMensal.resultado.toFixed(2)}
          </p>
        </div>
      </div>

      {/* DRE simples */}
      <div className="rounded-2xl p-6 shadow-xl mb-10" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.primary }}>
          📘 DRE simples (mensal)
        </h2>
        <div className="space-y-2">
          <p style={{ color: theme.colors.border }}>Receita bruta: R$ {dados.dre.receitaBruta.toFixed(2)}</p>
          <p style={{ color: theme.colors.border }}>Despesas operacionais: R$ {dados.dre.despesasOperacionais.toFixed(2)}</p>
          <p className="font-bold" style={{ color: dados.dre.lucroLiquido >= 0 ? theme.colors.success : theme.colors.danger }}>
            Lucro líquido: R$ {dados.dre.lucroLiquido.toFixed(2)}
          </p>
          <p style={{ color: theme.colors.border }}>
            Margem líquida: {dados.dre.margemLiquida.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Gráfico Entradas x Saídas */}
      <div className="rounded-2xl p-6 shadow-xl mb-10" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
          📊 Fluxo de Caixa - Entradas x Saídas
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dados.dadosGraficoEntradaSaida}>
            <XAxis dataKey="dia" stroke={theme.colors.border} />
            <YAxis stroke={theme.colors.border} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.colors.primary,
                border: `2px solid ${theme.colors.primaryLight}`,
              }}
              formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="entrada" fill={theme.colors.success} name="Entradas" />
            <Bar dataKey="saida" fill={theme.colors.danger} name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Histórico de Transações */}
      <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
          🧾 Histórico de Transações
        </h2>
        {dados.todasTransacoes.length === 0 ? (
          <p style={{ color: theme.colors.border }}>Nenhuma transação neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
                  <th className="text-left py-3 px-4" style={{ color: theme.colors.primary }}>
                    Data
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: theme.colors.primary }}>
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: theme.colors.primary }}>
                    Descrição
                  </th>
                  <th className="text-right py-3 px-4" style={{ color: theme.colors.primary }}>
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {dados.todasTransacoes.map((tx, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                      backgroundColor: idx % 2 === 0 ? theme.colors.primary : "transparent",
                    }}
                  >
                    <td className="py-3 px-4" style={{ color: theme.colors.border }}>
                      {new Date(tx.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: tx.tipo === "entrada" ? theme.colors.success : theme.colors.danger,
                          color: "white",
                        }}
                      >
                        {tx.tipo === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: theme.colors.border }}>
                      {tx.descricao}
                      {tx.tipo === "entrada" && (tx as { origem?: string }).origem && (
                        <span className="ml-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                          ({String((tx as { origem?: string }).origem).toUpperCase()})
                        </span>
                      )}
                    </td>
                    <td
                      className="py-3 px-4 text-right font-bold"
                      style={{
                        color: tx.tipo === "entrada" ? theme.colors.success : theme.colors.danger,
                      }}
                    >
                      {tx.tipo === "entrada" ? "+" : "-"} R$ {Number(tx.valor || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const SummaryCard = memo(function SummaryCard({
  title,
  value,
  icon,
  cor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  cor: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.colors.border }}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: cor }}>
            {value}
          </p>
        </div>
        <div style={{ color: cor, opacity: 0.7 }}>
          {icon}
        </div>
      </div>
    </div>
  );
});