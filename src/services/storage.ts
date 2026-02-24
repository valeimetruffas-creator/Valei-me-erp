export function salvar<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function carregar<T>(key: string): T {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
