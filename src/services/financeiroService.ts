import { useFinanceiroStore, Transacao } from "../store/useFinanceiroStore";

export const registrarEntrada = (descricao: string, valor: number) => {
  const transacao: Transacao = {
    id: crypto.randomUUID(),
    tipo: "entrada",
    descricao,
    valor,
    data: new Date().toISOString(),
  };
  useFinanceiroStore.getState().adicionarTransacao(transacao);
  useFinanceiroStore.getState().calcularSaldo();
};

export const registrarSaida = (descricao: string, valor: number) => {
  const transacao: Transacao = {
    id: crypto.randomUUID(),
    tipo: "saida",
    descricao,
    valor,
    data: new Date().toISOString(),
  };
  useFinanceiroStore.getState().adicionarTransacao(transacao);
  useFinanceiroStore.getState().calcularSaldo();
};