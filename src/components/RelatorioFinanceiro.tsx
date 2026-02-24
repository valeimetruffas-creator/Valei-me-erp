import { useFinanceiroStore } from "../store/useFinanceiroStore";
import { formatCurrencyBRL } from "../utils/formatCurrency";

export function RelatorioFinanceiro() {
  const { getRelatorio } = useFinanceiroStore();
  const relatorio = getRelatorio();

  return (
    <div>
      <h3>📈 Relatório Financeiro</h3>
      <p>Total de Entradas: {formatCurrencyBRL(relatorio.entradas)}</p>
      <p>Total de Saídas: {formatCurrencyBRL(relatorio.saidas)}</p>
      <p>Lucro Líquido: {formatCurrencyBRL(relatorio.lucroLiquido)}</p>
    </div>
  );
}