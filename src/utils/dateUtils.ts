// Retorna data e hora atuais formatadas
export function getHojeDataHora(): string {
  const hoje = new Date();
  const data = hoje.toLocaleDateString("pt-BR");
  const hora = hoje.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${data} ${hora}`;
}

// Retorna apenas a data atual
export function getHojeApenasData(): string {
  const hoje = new Date();
  return hoje.toLocaleDateString("pt-BR");
}

// Formata qualquer objeto Date para padrão brasileiro
export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}