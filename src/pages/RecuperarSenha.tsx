import { useState } from "react";
import { Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { recuperarSenha } from "../services/authService";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setLoading(true);

    try {
      await recuperarSenha(email);
      setMensagem("Enviamos um link de recuperação para seu e-mail.");
      console.log("[Auth] E-mail de recuperação enviado", email);
    } catch (error: unknown) {
      const firebaseError = error instanceof FirebaseError ? error : null;
      const code = firebaseError?.code ?? "auth/unknown";
      console.error("[Auth] Falha ao enviar recuperação", code, firebaseError?.message ?? error);

      if (code === "auth/invalid-email") {
        setErro("E-mail inválido.");
      } else if (code === "auth/user-not-found") {
        setErro("Usuário não encontrado para este e-mail.");
      } else {
        setErro("Não foi possível enviar o e-mail de recuperação.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-rose-200 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center text-rose-600">Recuperar senha</h1>

        {mensagem && <div className="bg-green-100 text-green-700 p-2 rounded text-sm text-center">{mensagem}</div>}
        {erro && <div className="bg-red-100 text-red-600 p-2 rounded text-sm text-center">{erro}</div>}

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 text-white p-3 rounded-lg font-semibold hover:bg-rose-700 transition disabled:opacity-70"
        >
          {loading ? "Enviando..." : "Enviar recuperação"}
        </button>

        <p className="text-sm text-center text-gray-600">
          <Link className="text-rose-600 font-medium" to="/login">Voltar ao login</Link>
        </p>
      </form>
    </div>
  );
}
