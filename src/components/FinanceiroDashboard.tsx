import { useFinanceiroStore } from "../store/useFinanceiroStore";
import { formatCurrencyBRL } from "../utils/formatCurrency";
import { formatDate } from "../utils/dateUtils";
import type { Transacao } from "../store/useFinanceiroStore";

export function FinanceiroDashboard() {
  const { saldo, transacoes } = useFinanceiroStore();

  return (
    <div>
      <h2>💰 Saldo Atual: {formatCurrencyBRL(saldo)}</h2>
      <h3>Histórico de Transações</h3>
      <ul>
        {transacoes.map((t: Transacao) => (
          <li key={t.id}>
            {formatDate(t.data)} - {t.descricao} -{" "}
            {t.tipo === "entrada" ? "+" : "-"} {formatCurrencyBRL(t.valor)}
          </li>
        ))}
      </ul>
    </div>
  );
}