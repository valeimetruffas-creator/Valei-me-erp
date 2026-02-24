import React, { useMemo } from "react";
import {
  ShoppingCart,
  DollarSign,
  Layers,
  TrendingUp,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { theme } from "../styles/theme";

export default function Dashboard() {
  const { vendas, fichas, produtos } = useConfeitariaStore();

  // Dados calculados
  const dados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const vendasHoje = vendas.filter(v => {
      const dataVenda = new Date(v.data);
      dataVenda.setHours(0, 0, 0, 0);
      return dataVenda.getTime() === hoje.getTime();
    });

    const receitaHoje = vendasHoje.reduce((sum, v) => sum + (v.quantidade * v.precoUnitario), 0);
    const quantidadeVendasHoje = vendasHoje.length;
    const ticketMedio = quantidadeVendasHoje > 0 ? receitaHoje / quantidadeVendasHoje : 0;

    // Produtos ativos/inativos - AGORA USA O CAMPO 'ativo' DO TIPO PRODUTO
    const produtosAtivos = produtos.filter(p => p.ativo === true).length;
    const produtosInativos = produtos.filter(p => p.ativo === false).length;
    const totalProdutos = produtos.length;

    // Vendas por dia (últimos 7 dias)
    const vendasPorDia: Record<string, number> = {};
    const hoje7 = new Date();
    for (let i = 0; i < 7; i++) {
      const data = new Date(hoje7);
      data.setDate(data.getDate() - i);
      const chave = data.toLocaleDateString('pt-BR');
      vendasPorDia[chave] = 0;
    }
    
    vendas.forEach(v => {
      const chave = new Date(v.data).toLocaleDateString('pt-BR');
      if (chave in vendasPorDia) {
        vendasPorDia[chave] += v.quantidade * v.precoUnitario;
      }
    });

    const dadosGraficoVendas = Object.entries(vendasPorDia)
      .reverse()
      .map(([dia, total]) => ({ dia, receita: total }));

    // Lucro por categoria
    const lucroCategoria: Record<string, number> = {};
    fichas.forEach(ficha => {
      const categoria = ficha.categoria;
      const lucroUnitario = ficha.precoVenda - ficha.custoUnitario;
      const vendidos = vendas.filter(v => v.produtoId === ficha.id).length;
      if (!lucroCategoria[categoria]) lucroCategoria[categoria] = 0;
      lucroCategoria[categoria] += lucroUnitario * vendidos;
    });

    const dadosLucroCategoria = Object.entries(lucroCategoria).map(([categoria, lucro]) => ({
      name: categoria,
      lucro,
    }));

    return {
      vendasHoje: quantidadeVendasHoje,
      receitaHoje,
      ticketMedio,
      produtosAtivos,
      produtosInativos,
      totalProdutos,
      dadosGraficoVendas,
      dadosLucroCategoria,
    };
  }, [vendas, fichas, produtos]);

  const coresGrafico = [
    theme.colors.primaryLight,
    theme.colors.primaryDark,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.danger,
  ];

  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      {/* Cabeçalho */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
          📊 Painel da Confeitaria
        </h1>
        <p style={{ color: theme.colors.background }}>
          Visão geral do seu negócio • {new Date().toLocaleDateString('pt-BR')}
        </p>
        <div className="mt-4">
          <Link
            to="/cardapio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: theme.colors.primaryLight,
              color: theme.colors.primary,
            }}
          >
            <Layers size={18} />
            Abrir Cardápio Delivery
          </Link>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <Card
          title="Vendas Hoje"
          value={dados.vendasHoje}
          subtitulo="transações"
          icon={<ShoppingCart size={32} />}
          cor={theme.colors.primaryLight}
        />
        <Card
          title="Receita Hoje"
          value={`R$ ${dados.receitaHoje.toFixed(2)}`}
          subtitulo="faturamento"
          icon={<DollarSign size={32} />}
          cor={theme.colors.success}
        />
        <Card
          title="Ticket Médio"
          value={`R$ ${dados.ticketMedio.toFixed(2)}`}
          subtitulo="por venda"
          icon={<TrendingUp size={32} />}
          cor={theme.colors.warning}
        />
        <Card
          title="Produtos Ativos"
          value={dados.produtosAtivos}
          subtitulo={`de ${dados.totalProdutos}`}
          icon={<Package size={32} />}
          cor={theme.colors.primaryDark}
        />
      </div>

      {/* Cards de Status de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card
          title="Produtos Ativos"
          value={dados.produtosAtivos}
          subtitulo="prontos para venda"
          icon={<Package size={32} />}
          cor={theme.colors.success}
        />
        <Card
          title="Produtos Inativos"
          value={dados.produtosInativos}
          subtitulo="desativados"
          icon={<AlertCircle size={32} />}
          cor={dados.produtosInativos > 0 ? theme.colors.warning : theme.colors.success}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Receita Últimos 7 Dias */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: theme.colors.background }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary }}>
            📈 Receita - Últimos 7 Dias
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dados.dadosGraficoVendas}>
              <XAxis dataKey="dia" stroke={theme.colors.border} />
              <YAxis stroke={theme.colors.border} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme.colors.primary, 
                  border: `2px solid ${theme.colors.primaryLight}` 
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke={theme.colors.primaryLight} 
                strokeWidth={3}
                dot={{ fill: theme.colors.primaryLight, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lucro por Categoria */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: theme.colors.background }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary }}>
            🍰 Lucro por Categoria
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dados.dadosLucroCategoria}
                dataKey="lucro"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: R$${value.toFixed(0)}`}
              >
                {dados.dadosLucroCategoria.map((_, index) => (
                  <Cell key={index} fill={coresGrafico[index % coresGrafico.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: theme.colors.primary, 
                  border: `2px solid ${theme.colors.primaryLight}` 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Info Cards Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard
          titulo="💡 Dica"
          conteudo="Monitore o ticket médio para otimizar suas vendas e aumentar o faturamento por transação."
          cor={theme.colors.warning}
        />
        <InfoCard
          titulo="📦 Gestão"
          conteudo={`Você tem ${dados.produtosAtivos} produtos ativos e ${dados.produtosInativos} inativos no sistema.`}
          cor={theme.colors.success}
        />
        <InfoCard
          titulo="🎯 Meta"
          conteudo="Mantenha o ticket médio acima de R$ 15 para melhorar a saúde financeira do negócio."
          cor={theme.colors.primaryLight}
        />
      </div>
    </div>
  );
}

const Card = React.memo(function Card({
  title,
  value,
  subtitulo,
  icon,
  cor,
}: {
  title: string;
  value: string | number;
  subtitulo: string;
  icon: React.ReactNode;
  cor: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: theme.colors.border }}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-1" style={{ color: cor }}>
            {value}
          </p>
          <p className="text-xs" style={{ color: theme.colors.border }}>
            {subtitulo}
          </p>
        </div>
        <div style={{ color: cor, opacity: 0.7 }}>
          {icon}
        </div>
      </div>
    </div>
  );
});

const InfoCard = React.memo(function InfoCard({
  titulo,
  conteudo,
  cor,
}: {
  titulo: string;
  conteudo: string;
  cor: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 shadow-lg"
      style={{
        backgroundColor: theme.colors.background,
        borderLeft: `4px solid ${cor}`,
      }}
    >
      <p className="font-bold mb-2" style={{ color: cor }}>
        {titulo}
      </p>
      <p style={{ color: theme.colors.border, fontSize: '0.95rem' }}>
        {conteudo}
      </p>
    </div>
  );
});
