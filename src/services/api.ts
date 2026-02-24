// Serviço de API para conexão com backend
const API_URL = import.meta.env.VITE_API_URL || '';
const API_ENABLED = import.meta.env.VITE_ENABLE_API === 'true';

function getApiBase() {
  if (!API_URL) {
    throw new Error("VITE_API_URL não configurada");
  }

  return API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
}

export const api = {
  post: async (url: string, data: any) => {
    if (!API_ENABLED || !navigator.onLine) {
      console.warn("Sistema operando em modo local");
      return { success: true, data, local: true };
    }

    try {
      const response = await fetch(`${getApiBase()}${url}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.warn("Sistema operando em modo local");
      return { success: true, data, local: true };
    }
  },

  get: async (url: string) => {
    if (!API_ENABLED || !navigator.onLine) {
      console.warn("Sistema operando em modo local");
      return { success: true, data: [], local: true };
    }

    try {
      const response = await fetch(`${getApiBase()}${url}`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      return await response.json();
    } catch (error) {
      console.warn("Sistema operando em modo local");
      return { success: true, data: [], local: true };
    }
  },

  isOnline: () => navigator.onLine && API_ENABLED
};