import React, { useState } from "react";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { Insumo } from "../types/Insumo";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import InsumoCard from "../components/InsumoCard";
import { theme } from "../styles/theme";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { 
  normalizarInsumo, 
  atualizarInsumo, 
  estoqueBaixo,
  calcularPrecoPorGrama,
  calcularEstoqueGramas
} from "../utils/insumoUtils";
import { formatCurrencyBRL } from "../utils/formatCurrency";
import { safeFixed, getPrecoPorGrama } from "../utils/safeNumbers";
import { AlertCircle, Edit2, Save, X } from "lucide-react";

export default function EstoqueInsumos() {
  const { insumos, addInsumo, updateInsumo, removeInsumo } = useConfeitariaStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  
  const [novoInsumo, setNovoInsumo] = useState<Partial<Insumo>>({
    nome: "",
    pesoEmbalagemGramas: 0,
    precoEmbalagem: 0,
    estoqueEmbalagens: 0,
    minimoGramas: 1000,
    categoria: "insumo"
  });

  const [edicao, setEdicao] = useState<Partial<Insumo>>({});

  const adicionarNovoInsumo = () => {
    if (!novoInsumo.nome || !novoInsumo.pesoEmbalagemGramas || !novoInsumo.precoEmbalagem) {
      alert("Preencha nome, peso da embalagem e preço");
      return;
    }

    if (novoInsumo.pesoEmbalagemGramas <= 0 || novoInsumo.precoEmbalagem < 0) {
      alert("Peso e preço não podem ser negativos ou zero");
      return;
    }

    const insumo = normalizarInsumo({
      nome: novoInsumo.nome,
      pesoEmbalagemGramas: novoInsumo.pesoEmbalagemGramas,
      precoEmbalagem: novoInsumo.precoEmbalagem,
      estoqueEmbalagens: novoInsumo.estoqueEmbalagens || 0,
      minimoGramas: novoInsumo.minimoGramas || 1000,
      categoria: novoInsumo.categoria || "insumo"
    });

    addInsumo(insumo);
    setNovoInsumo({
      nome: "",
      pesoEmbalagemGramas: 0,
      precoEmbalagem: 0,
      estoqueEmbalagens: 0,
      minimoGramas: 1000,
      categoria: "insumo"
    });
    setMostrarFormulario(false);
  };

  const iniciarEdicao = (insumo: Insumo) => {
    setEditandoId(insumo.id);
    setEdicao({ ...insumo });
  };

  const salvarEdicao = (insumoId: string) => {
    const insumoOriginal = insumos.find(i => i.id === insumoId);
    if (!insumoOriginal) return;

    // Valida valores
    if (!edicao.nome || edicao.pesoEmbalagemGramas! <= 0 || edicao.precoEmbalagem! < 0) {
      alert("Valores inválidos. Verifique os dados.");
      return;
    }

    const insumoAtualizado = atualizarInsumo(insumoOriginal, {
      nome: edicao.nome,
      pesoEmbalagemGramas: edicao.pesoEmbalagemGramas,
      precoEmbalagem: edicao.precoEmbalagem,
      estoqueEmbalagens: edicao.estoqueEmbalagens,
      minimoGramas: edicao.minimoGramas,
    });

    updateInsumo(insumoAtualizado);
    setEditandoId(null);
    setEdicao({});
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEdicao({});
  };

  const remover = (id: string, nome: string) => {
    if (confirm(`Remover "${nome}" do estoque?`)) {
      removeInsumo(id);
    }
  };

  const exportarJSON = () => {
    const blob = new Blob([JSON.stringify(insumos, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "estoque-insumos-backup.json");
  };

  const exportarExcel = () => {
    const dados = insumos.map(i => ({
      Nome: i.nome,
      Categoria: i.categoria || "insumo",
      "Peso Embalagem (g)": i.pesoEmbalagemGramas,
      "Preço Embalagem (R$)": i.precoEmbalagem,
      "Preço por Grama (R$)": safeFixed(getPrecoPorGrama(i), 4),
      "Embalagens em Estoque": i.estoqueEmbalagens,
      "Estoque Total (g)": i.estoqueGramas,
      "Estoque Mínimo (g)": i.minimoGramas,
    }));
    const planilha = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, planilha, "Estoque");
    const blob = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([blob]), "estoque-insumos.xlsx");
  };

  const importarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result as string);
        if (Array.isArray(dados)) {
          dados.forEach((item) => {
            const nomeLower = (item.nome || "").toLowerCase().trim();
            
            // Verifica se já existe insumo com mesmo nome (case-insensitive)
            const insumoExistente = insumos.find(i => i.nome.toLowerCase().trim() === nomeLower);
            
            if (insumoExistente) {
              // Se existe, atualiza apenas os campos
              const insumoAtualizado = atualizarInsumo(insumoExistente, item);
              updateInsumo(insumoAtualizado);
            } else {
              // Se não existe, cria novo
              const insumo = normalizarInsumo(item);
              addInsumo(insumo);
            }
          });
          alert("Insumos importados com sucesso!");
        } else {
          alert("JSON inválido");
        }
      } catch {
        alert("Erro ao importar JSON");
      }
    };
    reader.readAsText(file);
  };

  const importarExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      try {
        json.forEach((item: any) => {
          const nomeLower = (item.Nome || "").toLowerCase().trim();
          
          // Verifica se já existe insumo com mesmo nome (case-insensitive)
          const insumoExistente = insumos.find(i => i.nome.toLowerCase().trim() === nomeLower);
          
          const dadosInsumo = {
            nome: item.Nome || "",
            pesoEmbalagemGramas: Number(item["Peso Embalagem (g)"] || 1000),
            precoEmbalagem: Number(item["Preço Embalagem (R$)"] || 0),
            estoqueEmbalagens: Number(item["Embalagens em Estoque"] || 0),
            minimoGramas: Number(item["Estoque Mínimo (g)"] || 1000),
            categoria: (item.Categoria || "insumo").toLowerCase() as "insumo" | "embalagem"
          };
          
          if (insumoExistente) {
            // Se existe, atualiza apenas os campos
            const insumoAtualizado = atualizarInsumo(insumoExistente, dadosInsumo);
            updateInsumo(insumoAtualizado);
          } else {
            // Se não existe, cria novo
            const insumo = normalizarInsumo(dadosInsumo);
            addInsumo(insumo);
          }
        });
        alert("Insumos importados com sucesso!");
      } catch {
        alert("Erro ao importar Excel");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const top5 = [...insumos]
    .sort((a, b) => (b.estoqueGramas ?? 0) - (a.estoqueGramas ?? 0))
    .slice(0, 5)
    .map(i => ({ nome: i.nome, quantidade: i.estoqueGramas ?? 0 }));

  const normalizarTexto = (texto: string) =>
    texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const termoBusca = normalizarTexto(busca);
  const insumosFiltrados = insumos.filter((i) => {
    if (!termoBusca) return true;
    const nomeNormalizado = normalizarTexto(i.nome || "");
    const categoriaNormalizada = normalizarTexto(i.categoria || "");
    return nomeNormalizado.includes(termoBusca) || categoriaNormalizada.includes(termoBusca);
  });

  const ordenarPorNome = (a: Insumo, b: Insumo) =>
    (a.nome || "").localeCompare(b.nome || "", "pt-BR");

  const insumosCategoria = insumosFiltrados
    .filter((i) => i.categoria === "insumo")
    .slice()
    .sort(ordenarPorNome);

  const embalagens = insumosFiltrados
    .filter((i) => i.categoria === "embalagem")
    .slice()
    .sort(ordenarPorNome);
  const estoqueLow = insumos.filter(estoqueBaixo);

  const renderInsumoRow = (insumo: Insumo) => {
    if (editandoId === insumo.id) {
      return (
        <tr key={insumo.id} className="bg-yellow-50" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <td className="px-4 py-3">
            <input
              type="text"
              value={edicao.nome ?? ""}
              onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
              className="w-full px-2 py-1 border rounded"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />
          </td>
          <td className="px-4 py-3">
            <input
              type="number"
              value={edicao.pesoEmbalagemGramas ?? 0}
              onChange={(e) => setEdicao({ ...edicao, pesoEmbalagemGramas: Number(e.target.value) })}
              className="w-full px-2 py-1 border rounded"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />
          </td>
          <td className="px-4 py-3">
            <input
              type="number"
              step="0.01"
              value={edicao.precoEmbalagem ?? 0}
              onChange={(e) => setEdicao({ ...edicao, precoEmbalagem: Number(e.target.value) })}
              className="w-full px-2 py-1 border rounded"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />
          </td>
          <td className="px-4 py-3 text-center">{(edicao.precoEmbalagem ?? 0) > 0 && (edicao.pesoEmbalagemGramas ?? 0) > 0 ? formatCurrencyBRL((edicao.precoEmbalagem ?? 0) / (edicao.pesoEmbalagemGramas ?? 1)) : "-"}</td>
          <td className="px-4 py-3 text-center">
            <input
              type="number"
              value={edicao.estoqueEmbalagens ?? 0}
              onChange={(e) => setEdicao({ ...edicao, estoqueEmbalagens: Number(e.target.value) })}
              className="w-20 px-2 py-1 border rounded"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />
          </td>
          <td className="px-4 py-3 text-center">{((edicao.estoqueEmbalagens ?? 0) * (edicao.pesoEmbalagemGramas ?? 0)).toLocaleString()}g</td>
          <td className="px-4 py-3 text-center">
            <input
              type="number"
              value={edicao.minimoGramas ?? 0}
              onChange={(e) => setEdicao({ ...edicao, minimoGramas: Number(e.target.value) })}
              className="w-24 px-2 py-1 border rounded"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />
          </td>
          <td className="px-4 py-3 flex gap-2 justify-center">
            <button
              onClick={() => salvarEdicao(insumo.id)}
              className="text-white p-2 rounded hover:opacity-90"
              style={{ backgroundColor: theme.colors.primaryDark }}
            >
              <Save size={16} />
            </button>
            <button
              onClick={cancelarEdicao}
              className="text-white p-2 rounded hover:opacity-80"
              style={{ backgroundColor: '#6B7280' }}
            >
              <X size={16} />
            </button>
          </td>
        </tr>
      );
    }

    const baixo = estoqueBaixo(insumo);
    
    return (
      <tr key={insumo.id} className={baixo ? "bg-red-50" : ""} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
        <td className="px-4 py-3" style={{ color: theme.colors.primary }}>{insumo.nome ?? "-"}</td>
        <td className="px-4 py-3 text-center" style={{ color: theme.colors.primary }}>{insumo.pesoEmbalagemGramas ?? 0}g</td>
        <td className="px-4 py-3 text-center" style={{ color: theme.colors.primary }}>{insumo.precoEmbalagem !== undefined ? formatCurrencyBRL(insumo.precoEmbalagem) : "-"}</td>
        <td className="px-4 py-3 text-center text-sm" style={{ color: theme.colors.primary }}>{insumo.precoPorGrama !== undefined ? formatCurrencyBRL(insumo.precoPorGrama) : "-"}</td>
        <td className="px-4 py-3 text-center font-semibold" style={{ color: theme.colors.primary }}>{insumo.estoqueEmbalagens ?? 0}</td>
        <td className="px-4 py-3 text-center" style={{ color: theme.colors.primary }}>{(insumo.estoqueGramas ?? 0).toLocaleString()}g</td>
        <td className="px-4 py-3 text-center text-sm" style={{ color: theme.colors.primary }}>{insumo.minimoGramas ?? 1000}g</td>
        <td className="px-4 py-3 flex gap-2 justify-center">
          <button
            onClick={() => iniciarEdicao(insumo)}
            className="p-2 rounded hover:opacity-80"
            style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => remover(insumo.id, insumo.nome)}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
            title="Remover"
          >
            ×
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 pt-20 min-h-screen" style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: theme.colors.primaryLight }}>📦 Estoque de Insumos (Modelo Profissional)</h1>

      <div className="mb-6">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou categoria (insumo/embalagem)"
          className="w-full md:max-w-xl p-2 rounded border"
          style={{ color: theme.colors.primary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
        />
      </div>

      {estoqueLow.length > 0 && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-1" size={20} />
          <div>
            <h3 className="font-bold text-red-800">Atenção: {estoqueLow.length} insumo(s) com estoque baixo</h3>
            <p className="text-red-700 text-sm">{estoqueLow.map(i => i.nome).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="px-4 py-2 rounded font-bold hover:opacity-90 transition"
          style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
        >
          + Adicionar Insumo
        </button>

        <button
          onClick={exportarJSON}
          className="px-3 py-2 rounded hover:opacity-80"
          style={{ backgroundColor: theme.colors.primaryDark, color: 'white' }}
        >
          Exportar JSON
        </button>
        <button
          onClick={exportarExcel}
          className="px-3 py-2 rounded hover:opacity-80"
          style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
        >
          Exportar Excel
        </button>

        <label className="px-3 py-2 rounded cursor-pointer hover:opacity-80" style={{ backgroundColor: theme.colors.background, color: theme.colors.primary }}>
          Importar JSON
          <input type="file" accept=".json" onChange={importarJSON} hidden />
        </label>

        <label className="px-3 py-2 rounded cursor-pointer hover:opacity-80" style={{ backgroundColor: theme.colors.background, color: theme.colors.primary }}>
          Importar Excel
          <input type="file" accept=".xlsx" onChange={importarExcel} hidden />
        </label>
      </div>

      {mostrarFormulario && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary }}>Novo Insumo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Nome do insumo"
              value={novoInsumo.nome}
              onChange={(e) => setNovoInsumo({ ...novoInsumo, nome: e.target.value })}
              className="p-2 rounded border"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />

            <select
              value={novoInsumo.categoria}
              onChange={(e) => setNovoInsumo({ ...novoInsumo, categoria: e.target.value as "insumo" | "embalagem" })}
              className="p-2 rounded border"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            >
              <option value="insumo">Insumo</option>
              <option value="embalagem">Embalagem</option>
            </select>

            <div>
              <label className="text-sm" style={{ color: theme.colors.primary }}>Peso da Embalagem (gramas)</label>
              <input
                type="number"
                placeholder="Ex: 200"
                value={novoInsumo.pesoEmbalagemGramas}
                onChange={(e) => setNovoInsumo({ ...novoInsumo, pesoEmbalagemGramas: Number(e.target.value) })}
                className="w-full p-2 rounded border"
                style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
              />
            </div>

            <div>
              <label className="text-sm" style={{ color: theme.colors.primary }}>Preço da Embalagem (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 3.99"
                value={novoInsumo.precoEmbalagem}
                onChange={(e) => setNovoInsumo({ ...novoInsumo, precoEmbalagem: Number(e.target.value) })}
                className="w-full p-2 rounded border"
                style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
              />
            </div>

            {novoInsumo.pesoEmbalagemGramas && novoInsumo.precoEmbalagem ? (
              <div className="col-span-1 md:col-span-2 p-2 rounded" style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}>
                <strong>Preço por Grama: {formatCurrencyBRL(novoInsumo.precoEmbalagem / novoInsumo.pesoEmbalagemGramas)}</strong>
              </div>
            ) : null}

            <input
              type="number"
              placeholder="Quantidade de embalagens"
              value={novoInsumo.estoqueEmbalagens}
              onChange={(e) => setNovoInsumo({ ...novoInsumo, estoqueEmbalagens: Number(e.target.value) })}
              className="p-2 rounded border"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />

            <input
              type="number"
              placeholder="Estoque mínimo (g)"
              value={novoInsumo.minimoGramas}
              onChange={(e) => setNovoInsumo({ ...novoInsumo, minimoGramas: Number(e.target.value) })}
              className="p-2 rounded border"
              style={{ color: theme.colors.primary, borderColor: theme.colors.border }}
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={adicionarNovoInsumo}
              className="text-white px-4 py-2 rounded hover:opacity-90"
              style={{ backgroundColor: theme.colors.primaryDark }}
            >
              Salvar
            </button>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="text-white px-4 py-2 rounded hover:opacity-80"
              style={{ backgroundColor: '#6B7280' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Insumos */}
      <div className="mb-10 rounded-lg overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-xl font-semibold p-4" style={{ color: theme.colors.primary, backgroundColor: theme.colors.primaryLight }}>🍰 Insumos ({insumosCategoria.length})</h2>
        {insumosCategoria.length === 0 ? (
          <p className="p-4 italic" style={{ color: theme.colors.primary }}>Nenhum insumo cadastrado.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-white" style={{ backgroundColor: theme.colors.primaryDark }}>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-center">Peso Emb.</th>
                <th className="px-4 py-2 text-center">Preço Emb.</th>
                <th className="px-4 py-2 text-center text-xs">Preço/g</th>
                <th className="px-4 py-2 text-center">Emb.</th>
                <th className="px-4 py-2 text-center">Total (g)</th>
                <th className="px-4 py-2 text-center text-xs">Mín.</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: theme.colors.background }}>
              {insumosCategoria.map(renderInsumoRow)}
            </tbody>
          </table>
        )}
      </div>

      {/* Tabela de Embalagens */}
      <div className="mb-10 rounded-lg overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-xl font-semibold p-4" style={{ color: theme.colors.primary, backgroundColor: theme.colors.primaryLight }}>📦 Embalagens ({embalagens.length})</h2>
        {embalagens.length === 0 ? (
          <p className="p-4 italic" style={{ color: theme.colors.primary }}>Nenhuma embalagem cadastrada.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-white" style={{ backgroundColor: theme.colors.primaryDark }}>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-center">Peso Emb.</th>
                <th className="px-4 py-2 text-center">Preço Emb.</th>
                <th className="px-4 py-2 text-center text-xs">Preço/g</th>
                <th className="px-4 py-2 text-center">Emb.</th>
                <th className="px-4 py-2 text-center">Total (g)</th>
                <th className="px-4 py-2 text-center text-xs">Mín.</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: theme.colors.background }}>
              {embalagens.map(renderInsumoRow)}
            </tbody>
          </table>
        )}
      </div>

      {top5.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primaryLight }}>📊 Top 5 em Estoque</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top5}>
              <XAxis dataKey="nome" stroke={theme.colors.background} />
              <YAxis stroke={theme.colors.background} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.colors.background, color: theme.colors.primary }}
              />
              <Bar dataKey="quantidade" fill={theme.colors.primaryLight} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
