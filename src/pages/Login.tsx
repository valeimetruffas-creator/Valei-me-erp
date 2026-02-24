import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { Link, useNavigate } from "react-router-dom";
import { loginComEmailSenha } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const userCredential = await loginComEmailSenha(email, senha);
      console.log("[Auth] Login realizado com sucesso", {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });
      navigate("/"); // entra no sistema
    } catch (error: unknown) {
      const firebaseError = error instanceof FirebaseError ? error : null;
      const errorCode = firebaseError?.code ?? "auth/unknown";
      const errorMessage = firebaseError?.message ?? "Erro desconhecido no login.";

      console.error("[Auth] Falha no login", errorCode, errorMessage);

      if (errorCode === "auth/user-not-found") {
        setErro("Usuário não encontrado.");
      } else if (errorCode === "auth/wrong-password") {
        setErro("Senha incorreta.");
      } else if (errorCode === "auth/invalid-email") {
        setErro("Email inválido.");
      } else if (errorCode === "auth/invalid-credential") {
        setErro("Credenciais inválidas. Verifique email e senha.");
      } else {
        setErro("Erro ao entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-rose-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-5"
      >
        <h1 className="text-2xl font-bold text-center text-rose-600">
          Valei-me Confeitaria
        </h1>
        <p className="text-center text-gray-500 text-sm">
          Acesso ao sistema
        </p>

        {erro && (
          <div className="bg-red-100 text-red-600 p-2 rounded text-sm text-center">
            {erro}
          </div>
        )}

        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            placeholder="seuemail@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 text-white p-3 rounded-lg font-semibold hover:bg-rose-700 transition"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="text-sm text-center text-gray-600 flex items-center justify-between gap-2">
          <Link className="text-rose-600 font-medium" to="/recuperar-senha">
            Esqueci minha senha
          </Link>
          <Link className="text-rose-600 font-medium" to="/cadastro">
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  );
}
