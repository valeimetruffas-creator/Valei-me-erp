import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { criarContaComEmpresa } from "../services/authService";

export default function Cadastro() {
  const navigate = useNavigate();
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await criarContaComEmpresa({
        nomeUsuario,
        nomeEmpresa,
        email,
        senha,
      });

      navigate("/");
    } catch (error: unknown) {
      const firebaseError = error instanceof FirebaseError ? error : null;
      const code = firebaseError?.code ?? "auth/unknown";

      console.error("[Auth] Erro no cadastro", code, firebaseError?.message ?? error);

      if (code === "auth/email-already-in-use") {
        setErro("Este e-mail já está em uso.");
      } else if (code === "auth/weak-password") {
        setErro("Senha fraca. Use pelo menos 6 caracteres.");
      } else if (code === "auth/invalid-email") {
        setErro("E-mail inválido.");
      } else {
        setErro("Não foi possível criar sua conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-rose-200 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center text-rose-600">Criar conta</h1>

        {erro && <div className="bg-red-100 text-red-600 p-2 rounded text-sm text-center">{erro}</div>}

        <div>
          <label className="text-sm text-gray-600">Seu nome</label>
          <input
            className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Nome da empresa</label>
          <input
            className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={nomeEmpresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">E-mail</label>
          <input
            type="email"
            className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Senha</label>
          <input
            type="password"
            className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 text-white p-3 rounded-lg font-semibold hover:bg-rose-700 transition disabled:opacity-70"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-sm text-center text-gray-600">
          Já tem conta? <Link className="text-rose-600 font-medium" to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
