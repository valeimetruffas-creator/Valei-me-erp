import Logo from "../assets/Logo-pequena.png";
import { theme } from "../styles/theme";
import { LogOut } from "lucide-react";
import { logoutUsuario } from "../services/authService";

export default function Header() {

  // 🔥 FUNÇÃO DE SAIR (TEM QUE FICAR AQUI DENTRO)
  async function handleLogout() {
    try {
      await logoutUsuario();
      console.log("[Auth] Logout realizado com sucesso");
    } catch (error) {
      console.error("[Auth] Falha ao fazer logout", error);
    }
  }

  return (
    <header
      className="flex items-center justify-between px-6 h-16 font-semibold shadow-md fixed top-0 left-0 right-0 z-30"
      style={{
        backgroundColor: theme.colors.primaryLight,
        color: theme.colors.primaryDark,
        userSelect: "none"
      }}
    >
      {/* Logo e Nome */}
      <div className="flex items-center gap-4">
        <img src={Logo} alt="Logo Valei-me" className="h-12 w-auto" />
        <span className="text-lg">Valei-me Confeitaria</span>
      </div>

      {/* Botões Direita */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
        >
          <LogOut size={18} />
          Sair
        </button>

      </div>
    </header>
  );
}