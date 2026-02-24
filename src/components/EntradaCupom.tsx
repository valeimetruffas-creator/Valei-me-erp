import React, { useState } from "react";
import { XMLParser } from "fast-xml-parser";
import LeitorQrCode from "./LeitorQrCode";
import { consultaQrCode } from "../services/qrService";
import { toast } from "react-toastify";

interface ProdutoEntrada {
  nome: string;
  quantidade: number;
  preco: number;
  categoria: "insumo" | "embalagem";
}
type Props = {
  onConfirm: (dados: any) => void;
  onClose: () => void;
};

interface DadosEntrada {
  fornecedor: string;
  data: string;
  chave: string;
  produtos: ProdutoEntrada[];
}

export default function EntradaCupom({ onConfirm, onClose }: Props) {
  const [modo, setModo] = useState<"xml" | "qrcode" | "url" | null>(null);
  const [entrada, setEntrada] = useState<DadosEntrada | null>(null);
  const [urlQrCode, setUrlQrCode] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [notasRegistradas, setNotasRegistradas] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("notas-registradas") || "[]")
  );

  const detectarCategoria = (nome: string): "insumo" | "embalagem" => {
    const categoriaSalva = JSON.parse(localStorage.getItem("estoque-categorizado") || "[]")
      .find((i: any) => i.nome === nome)?.categoria;

    if (categoriaSalva) return categoriaSalva;

    const nomeMin = nome.toLowerCase();
    if (nomeMin.includes("caixa") || nomeMin.includes("pote") || nomeMin.includes("embalagem")) return "embalagem";
    return "insumo";
  };

  const processarXML = (xmlText: string) => {
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xmlText);

    const produtos = json.nfeProc?.NFe?.infNFe?.det || [];

    const listaProdutos: ProdutoEntrada[] = Array.isArray(produtos)
      ? produtos.map((p: any) => {
          const prod = p.prod;
          return {
            nome: prod.xProd,
            quantidade: parseFloat(prod.qCom),
            preco: parseFloat(prod.vUnCom),
            categoria: detectarCategoria(prod.xProd),
          };
        })
      : [];

    const chave = json.nfeProc?.protNFe?.infProt?.chNFe || "";
    const fornecedor = json.nfeProc?.NFe?.infNFe?.emit?.xNome || "Fornecedor Desconhecido";
    const data = json.nfeProc?.NFe?.infNFe?.ide?.dhEmi || new Date().toISOString();

    if (notasRegistradas.includes(chave)) {
      toast.error("Essa nota fiscal já foi registrada anteriormente.");
      return;
    }

    const dados: DadosEntrada = {
      fornecedor,
      data,
      chave,
      produtos: listaProdutos,
    };

    setEntrada(dados);
  };

  const confirmarEntrada = () => {
    if (!entrada) return;
    const novas = [...notasRegistradas, entrada.chave];
    localStorage.setItem("notas-registradas", JSON.stringify(novas));
    setNotasRegistradas(novas);
    onConfirm(entrada); // <-- corrigido aqui
    setConfirmado(true);
  };

  return (
    <div className="p-4 text-black">
      {!modo && (
        <div className="space-y-4">
          <button onClick={() => setModo("xml")} className="bg-pink-500 text-white px-4 py-2 rounded">📂 Importar XML</button>
          <button onClick={() => setModo("qrcode")} className="bg-purple-600 text-white px-4 py-2 rounded">📷 Ler QR Code com Câmera</button>
          <button onClick={() => setModo("url")} className="bg-yellow-600 text-white px-4 py-2 rounded">🔗 Colar URL do QR Code</button>
        </div>
      )}

      {modo === "xml" && !entrada && (
        <div className="mt-4">
          <input
            type="file"
            accept=".xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const text = reader.result as string;
                processarXML(text);
              };
              reader.readAsText(file);
            }}
          />
        </div>
      )}

      {modo === "url" && !entrada && (
        <div className="mt-4 space-y-2">
          <input
            value={urlQrCode}
            onChange={(e) => setUrlQrCode(e.target.value)}
            placeholder="Cole a URL completa do QR Code"
            className="p-2 border w-full"
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={async () => {
              try {
                const estado = "SP"; // ajuste se necessário
                const data = await consultaQrCode(urlQrCode, estado);

                if (!data.nota_valida) {
                  toast.error("Nota inválida ou não encontrada.");
                  return;
                }

                if (notasRegistradas.includes(data.chave)) {
                  toast.error("Essa nota fiscal já foi registrada anteriormente.");
                  return;
                }

                const produtos = data.det?.map((item: any) => ({
                  nome: item.prod.xProd,
                  quantidade: parseFloat(item.prod.qCom),
                  preco: parseFloat(item.prod.vUnCom),
                  categoria: detectarCategoria(item.prod.xProd),
                })) || [];

                setEntrada({
                  fornecedor: data.emitente?.[0]?.xNome || "Fornecedor Desconhecido",
                  data: data.data_emissao || new Date().toISOString(),
                  chave: data.chave,
                  produtos,
                });
              } catch (err) {
                toast.error("Erro ao consultar a URL do QR Code.");
                console.error(err);
              }
            }}
          >
            🔍 Consultar
          </button>
        </div>
      )}

      {modo === "qrcode" && !entrada && (
        <div className="mt-4 space-y-2">
          <LeitorQrCode
            onConfirm={(dados) => setEntrada(dados)}
            onClose={() => setModo(null)}
          />
        </div>
      )}

      {entrada && !confirmado && (
        <div className="mt-6 border rounded p-4 bg-white">
          <h2 className="text-xl font-bold text-pink-600 mb-2">✅ Cupom carregado</h2>
          <p><strong>Fornecedor:</strong> {entrada.fornecedor}</p>
          <p><strong>Data:</strong> {new Date(entrada.data).toLocaleString("pt-BR")}</p>
          <p><strong>Chave:</strong> {entrada.chave}</p>

          <h3 className="text-lg font-semibold mt-4">Produtos:</h3>
          <ul className="list-disc ml-6 space-y-1">
            {entrada.produtos.map((p, i) => (
              <li key={i}>
                {p.nome} | Qtd: {p.quantidade} | Preço: R$ {p.preco.toFixed(2)} | Categoria: {p.categoria}
              </li>
            ))}
          </ul>

          <button onClick={confirmarEntrada} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
            ✅ Confirmar Entrada
          </button>
        </div>
      )}

      {confirmado && <p className="mt-4 text-green-700 font-semibold">Entrada registrada com sucesso!</p>}
    </div>
  );
}