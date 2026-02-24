import { useState } from "react";
import { useFinanceiroStore } from "../store/useFinanceiroStore";

export function TransacaoForm() {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");

  const { registrarEntrada, registrarSaida } = useFinanceiroStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tipo === "entrada") {
      registrarEntrada(descricao, valor);
    } else {
      registrarSaida(descricao, valor);
    }
    setDescricao("");
    setValor(0);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem" }}>
      <input
        type="text"
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <input
        type="number"
        placeholder="Valor"
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
      />
      <select value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
        <option value="entrada">Entrada</option>
        <option value="saida">Saída</option>
      </select>
      <button type="submit">Registrar</button>
    </form>
  );
}