import { Link } from "react-router-dom";
import { MODULOS_CONFIGURACAO } from "../types/ConfiguracoesSistema";
import { theme } from "../styles/theme";

export default function Configuracoes() {
  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
          ⚙️ Configurações do Sistema
        </h1>
        <p style={{ color: theme.colors.background }}>
          Central profissional de parametrização do ERP, delivery e integrações externas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MODULOS_CONFIGURACAO.map((modulo) => (
          <Link
            key={modulo.chave}
            to={modulo.rota}
            className="rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
            style={{ backgroundColor: theme.colors.background }}
          >
            <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.primary }}>
              {modulo.titulo}
            </h2>
            <p style={{ color: theme.colors.border }}>{modulo.descricao}</p>
            <div className="mt-4 text-sm font-semibold" style={{ color: theme.colors.primaryDark }}>
              Abrir módulo →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
