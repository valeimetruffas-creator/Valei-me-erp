import React, { useEffect, useRef, useState } from "react";
import { addStock } from "../services/stockService";
import * as XLSX from "xlsx";

interface Produto {
  codigo: string;
  nome: string;
  quantidade: number;
  preco: number;
  tipo: string; // unidade, gramas, ml
}

type Props = {
  onConfirm: (dados: any) => void;
  onClose: () => void;
};;

interface Nota {
  id: string;
  fornecedor: string;
  data: string;
  total: number;
  produtos: Produto[];
}

export default function EntradaManual({ onClose, onConfirm}: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedor, setFornecedor] = useState<string>("");
  const [codigo, setCodigo] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [preco, setPreco] = useState<number>(0);
  const [tipo, setTipo] = useState<string>("unidade");
  const [frete, setFrete] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const refCodigo = useRef<HTMLInputElement>(null);
  const refNome = useRef<HTMLInputElement>(null);
  const refQtd = useRef<HTMLInputElement>(null);
  const refPreco = useRef<HTMLInputElement>(null);

  const calcularQuantidadeReal = (p: Produto) => {
    if (p.tipo === "gramas") return p.quantidade / 400;
    if (p.tipo === "unidade" && p.nome.includes("20unidade")) return p.quantidade / 20;
    if (p.tipo === "unidade" && p.nome.includes("50unidade")) return p.quantidade / 50;
    return p.quantidade;
  };

  const subtotal = produtos.reduce((sum, p) => {
    return sum + p.preco * calcularQuantidadeReal(p);
  }, 0);

  const total = subtotal + frete - desconto;

  const adicionarProduto = () => {
    if (!nome || quantidade <= 0 || preco <= 0) return;
    const novoProduto: Produto = { codigo, nome, quantidade, preco, tipo };

    if (editIndex !== null) {
      const atualizados = [...produtos];
      atualizados[editIndex] = novoProduto;
      setProdutos(atualizados);
      setEditIndex(null);
    } else {
      setProdutos([...produtos, novoProduto]);
    }

    setCodigo("");
    setNome("");
    setQuantidade(1);
    setPreco(0);
    setTipo("unidade");
    refCodigo.current?.focus();
  };

  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const editarProduto = (index: number) => {
    const p = produtos[index];
    setCodigo(p.codigo);
    setNome(p.nome);
    setQuantidade(p.quantidade);
    setPreco(p.preco);
    setTipo(p.tipo);
    setEditIndex(index);
    refCodigo.current?.focus();
  };

  const exportarXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(produtos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "entrada-manual.xlsx");
  };

  const imprimirEstoque = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write("<h1>Estoque Atual</h1><ul>");
      produtos.forEach((p) => {
        win.document.write(
          `<li>${p.codigo} - ${p.nome} - ${p.quantidade}${p.tipo} - R$ ${p.preco.toFixed(2)}</li>`
        );
      });
      win.document.write("</ul>");
      win.print();
    }
  };

  const confirmar = () => {
    const nota: Nota = {
      id: Date.now().toString(),
      fornecedor: fornecedor || "Entrada Manual",
      data: new Date().toISOString(),
      total,
      produtos,
    };

    const notasExistentes = JSON.parse(localStorage.getItem("notas") || "[]");
    notasExistentes.push(nota);
    localStorage.setItem("notas", JSON.stringify(notasExistentes));

    produtos.forEach((p) => {
      const qtdFinal = p.tipo === "gramas" || p.tipo === "ml" ? p.quantidade / 1000 : p.quantidade;
      addStock({ nome: p.nome, quantidade: qtdFinal, preco: p.preco });
    });

    onConfirm(nota);
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (document.activeElement === refCodigo.current) refNome.current?.focus();
        else if (document.activeElement === refNome.current) refQtd.current?.focus();
        else if (document.activeElement === refQtd.current) refPreco.current?.focus();
        else if (document.activeElement === refPreco.current) adicionarProduto();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [codigo, nome, quantidade, preco, tipo, editIndex]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-yellow-100 border-2 border-yellow-200 text-black rounded-xl shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
          <img src="/icons/import.png" className="w-6 h-6" alt="Entrada Manual" /> Entrada Manual
        </h2>

        <input
          value={fornecedor}
          onChange={(e) => setFornecedor(e.target.value)}
          placeholder="Fornecedor (obrigatório)"
          className="w-full p-2 rounded border mb-3"
        />

        <div className="grid grid-cols-12 gap-2 mb-3">
          <input
            ref={refCodigo}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código"
            className="col-span-2 p-2 border rounded"
          />
          <input
            ref={refNome}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Produto"
            className="col-span-3 p-2 border rounded"
          />
          <input
            ref={refQtd}
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            placeholder="Qtd"
            className="col-span-2 p-2 border rounded"
          />
          <input
            ref={refPreco}
            type="number"
            value={preco}
            onChange={(e) => setPreco(Number(e.target.value))}
            placeholder="Preço"
            className="col-span-2 p-2 border rounded"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="col-span-2 border p-2 rounded"
          >
            <option value="unidade">uni</option>
            <option value="gramas">g</option>
            <option value="ml">ml</option>
          </select>
          <button
            onClick={adicionarProduto}
            className="col-span-1 bg-yellow-700 text-white rounded px-2"
          >
            {editIndex !== null ? "✔" : "+"}
          </button>
        </div>

        <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
          {produtos.map((p, i) => (
            <li
              key={i}
              className="flex justify-between border px-2 py-1 bg-white rounded"
            >
              <span>
                <b>{p.codigo}</b> - {p.nome} - {p.quantidade}
                {p.tipo} R$ {p.preco.toFixed(2)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => editarProduto(i)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => removerProduto(i)}
                  className="text-red-600 hover:underline"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <input
            type="number"
            value={frete}
            onChange={(e) => setFrete(Number(e.target.value))}
            placeholder="Frete (opcional)"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value))}
            placeholder="Desconto (opcional)"
            className="p-2 border rounded"
          />
        </div>

        <div className="mt-4 text-right text-lg font-bold">
          Subtotal: <span className="text-yellow-700">R$ {subtotal.toFixed(2)}</span><br />
          Frete: <span className="text-yellow-700">R$ {frete.toFixed(2)}</span><br />
          Desconto: <span className="text-yellow-700">R$ {desconto.toFixed(2)}</span><br />
          <div className="mt-2 text-xl">
            Total: <span className="text-green-700">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={imprimirEstoque}
            className="px-4 py-2 bg-yellow-600 text-white rounded"
          >
            Imprimir Estoque
          </button>
          <button
            onClick={exportarXLSX}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Exportar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            className="px-4 py-2 bg-green-700 text-white rounded"
            disabled={produtos.length === 0}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}