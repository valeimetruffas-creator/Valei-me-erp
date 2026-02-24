import { ClienteVenda } from "../../types/Venda";

interface VendaClienteProps {
  cliente: ClienteVenda | null;
  obrigatorio?: boolean;
  onChange: (cliente: ClienteVenda) => void;
}

export function VendaCliente({ cliente, obrigatorio = false, onChange }: VendaClienteProps) {
  const clienteAtual: ClienteVenda =
    cliente ?? { nome: "", telefone: "", endereco: "" };

  return (
    <div className="bg-[#676C3C] p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-3">
        Cliente {obrigatorio ? "(obrigatório)" : "(opcional)"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={clienteAtual.nome}
          onChange={(e) => onChange({ ...clienteAtual, nome: e.target.value })}
          placeholder="Nome"
          className="p-2 rounded text-black"
        />
        <input
          value={clienteAtual.telefone}
          onChange={(e) => onChange({ ...clienteAtual, telefone: e.target.value })}
          placeholder="Telefone"
          className="p-2 rounded text-black"
        />
        <input
          value={clienteAtual.endereco}
          onChange={(e) => onChange({ ...clienteAtual, endereco: e.target.value })}
          placeholder="Endereço"
          className="p-2 rounded text-black"
        />
      </div>
    </div>
  );
}
