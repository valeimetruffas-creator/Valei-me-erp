import React from "react";
import { theme } from "../../styles/theme";

interface PainelModuloConfiguracaoProps {
  titulo: string;
  descricao: string;
  mensagem: string;
  tipoFeedback: "sucesso" | "erro" | "neutro";
  carregando: boolean;
  salvando: boolean;
  onSalvar: () => void;
  children: React.ReactNode;
}

function corFeedback(tipoFeedback: "sucesso" | "erro" | "neutro"): string {
  if (tipoFeedback === "sucesso") return theme.colors.success;
  if (tipoFeedback === "erro") return theme.colors.danger;
  return theme.colors.border;
}

export default function PainelModuloConfiguracao({
  titulo,
  descricao,
  mensagem,
  tipoFeedback,
  carregando,
  salvando,
  onSalvar,
  children,
}: PainelModuloConfiguracaoProps) {
  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
            {titulo}
          </h1>
          <p style={{ color: theme.colors.background }}>{descricao}</p>
        </div>

        <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: theme.colors.background }}>
          {carregando ? (
            <p style={{ color: theme.colors.primary }}>Carregando configurações...</p>
          ) : (
            <div className="space-y-6">{children}</div>
          )}

          {mensagem && (
            <div
              className="mt-6 p-3 rounded-lg border"
              style={{
                borderColor: corFeedback(tipoFeedback),
                color: corFeedback(tipoFeedback),
                backgroundColor: `${corFeedback(tipoFeedback)}20`,
              }}
            >
              {mensagem}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={onSalvar}
              disabled={salvando || carregando}
              className="px-6 py-3 rounded-lg font-bold disabled:opacity-60"
              style={{ backgroundColor: theme.colors.primaryDark, color: "white" }}
            >
              {salvando ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
