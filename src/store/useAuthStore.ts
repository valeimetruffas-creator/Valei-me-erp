import { create } from "zustand";

interface Usuario {
  id: string;
  nome: string;
  tipo: "admin" | "funcionario";
}

interface AuthState {
  usuario: Usuario;
  setUsuario: (user: Usuario) => void;
}

// 🔐 Store de autenticação (controle de permissão)
export const useAuthStore = create<AuthState>((set) => ({
  usuario: {
    id: "admin-master",
    nome: "Administrador",
    tipo: "admin", // 👈 TROQUE PARA "funcionario" SE QUISER TESTAR BLOQUEIO
  },

  setUsuario: (user) => set({ usuario: user }),
}));
