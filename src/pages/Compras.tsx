import { useState, useMemo } from "react";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { theme } from "../styles/theme";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { sanitize, validateInput } from "../utils/security";
import { CompraService, ItemCompraTemp } from "../services/compraService";
import { Compra } from "../types/Compra";
import { Insumo } from "../types/Insumo";
import { normalizarInsumo } from "../utils/insumoUtils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalDateFromString = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const localDateToISO = (dateString: string) => {
  // dateString vem no formato YYYY-MM-DD (hora local)
  const [year, month, day] = dateString.split('-').map(Number);
  // Cria uma data para o meio-dia do dia especificado
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
};

export default function Compras() {
  const { compras, insumos } = useConfeitariaStore();

  type FeedbackTipo = "sucesso" | "erro" | "info";

  const [fornecedorId, setFornecedorId] = useState("");
  const [numeroNota, setNumeroNota] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<"manual" | "nfe" | "nfce">("manual");
  const [dataCompra, setDataCompra] = useState(getLocalDateString());
  const [dataEmissao, setDataEmissao] = useState(getLocalDateString());
  const [itensCompra, setItensCompra] = useState<ItemCompraTemp[]>([]);
  const [filtroData, setFiltroData] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [exibirFormulario, setExibirFormulario] = useState(true);
  const [compraEmEdicao, setCompraEmEdicao] = useState<Compra | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: FeedbackTipo; mensagem: string } | null>(null);
  const [mostrarNovoInsumo, setMostrarNovoInsumo] = useState(false);
  const [salvandoInsumo, setSalvandoInsumo] = useState(false);
  const [novoInsumo, setNovoInsumo] = useState<Partial<Insumo>>({
    nome: "",
    pesoEmbalagemGramas: 0,
    precoEmbalagem: 0,
    categoria: "insumo",
    estoqueEmbalagens: 0,
    minimoGramas: 1000
  });

  const insumosOrdenados = [...insumos].sort((a, b) =>
    (a.nome || "").localeCompare(b.nome || "", "pt-BR")
  );

  const dashboard = useMemo(() => CompraService.gerarDashboard(compras), [compras]);
  
  const comprasFiltradas = useMemo(() => 
    CompraService.filtrarCompras(compras, filtroData, filtroFornecedor), 
    [compras, filtroData, filtroFornecedor]
  );

  // Calcula total diretamente sem useMemo para garantir sempre atualizar
  const totalCompra = itensCompra.reduce((total, item) => total + (Number(item.custoTotal) || 0), 0);

  const resetNovoInsumo = () => {
    setNovoInsumo({
      nome: "",
      pesoEmbalagemGramas: 0,
      precoEmbalagem: 0,
      categoria: "insumo",
      estoqueEmbalagens: 0,
      minimoGramas: 1000
    });
  };

  const exibirFeedback = (tipo: FeedbackTipo, mensagem: string) => {
    setFeedback({ tipo, mensagem });
  };

  const salvarNovoInsumo = async () => {
    const nome = (novoInsumo.nome || "").trim();
    const pesoEmbalagemGramas = Number(novoInsumo.pesoEmbalagemGramas ?? 0);
    const precoEmbalagem = Number(novoInsumo.precoEmbalagem ?? 0);
    const estoqueEmbalagens = Number(novoInsumo.estoqueEmbalagens ?? 0);
    const minimoGramas = Number(novoInsumo.minimoGramas ?? 1000);
    const categoria = (novoInsumo.categoria || "insumo") as "insumo" | "embalagem";

    if (!nome) {
      exibirFeedback("erro", "Nome do insumo é obrigatório.");
      return;
    }

    if (pesoEmbalagemGramas <= 0) {
      exibirFeedback("erro", "Peso da embalagem deve ser maior que zero.");
      return;
    }

    if (precoEmbalagem < 0) {
      exibirFeedback("erro", "Preço da embalagem não pode ser negativo.");
      return;
    }

    const nomeLower = nome.toLowerCase();
    const existe = insumos.some(i => (i.nome || "").trim().toLowerCase() === nomeLower);
    if (existe) {
      exibirFeedback("erro", "Já existe um insumo com esse nome.");
      return;
    }

    const insumoNormalizado = normalizarInsumo({
      nome,
      pesoEmbalagemGramas,
      precoEmbalagem,
      estoqueEmbalagens: estoqueEmbalagens ?? 0,
      minimoGramas: minimoGramas ?? 1000,
      categoria
    });

    useConfeitariaStore.getState().addInsumo(insumoNormalizado);
    const insumosAtualizados = [...insumos, insumoNormalizado];

    try {
      setSalvandoInsumo(true);
      await updateDoc(doc(db, "confeitaria", "dados"), {
        insumos: insumosAtualizados
      });
      exibirFeedback("sucesso", "Insumo criado com sucesso.");
      setMostrarNovoInsumo(false);
      resetNovoInsumo();
    } catch {
      exibirFeedback("erro", "Erro ao salvar insumo.");
    } finally {
      setSalvandoInsumo(false);
    }
  };

  const adicionarItem = () => {
    setItensCompra(prev => [...prev, { 
      insumoId: "", 
      unidades: 0, 
      pesoPorUnidade: 0, 
      precoUnitario: 0, 
      quantidadeGramas: 0, 
      custoTotal: 0 
    }]);
  };

  const atualizarItem = (index: number, campo: keyof ItemCompraTemp, valor: string | number) => {
    setItensCompra(prev =>
      prev.map((item, i) => 
        i === index ? CompraService.calcularItensCompra(item, campo, valor) : item
      )
    );
  };

  const removerItem = (index: number) => {
    setItensCompra(prev => prev.filter((_, i) => i !== index));
  };

  const carregarParaEdicao = (compra: Compra) => {
    setCompraEmEdicao(compra);
    setFornecedorId(compra.fornecedor);
    setNumeroNota(compra.numeroNota || "");
    setTipoDocumento((compra.tipoDocumento as "manual" | "nfe" | "nfce") || "manual");
    setDataCompra(getLocalDateFromString(compra.data));
    setDataEmissao(getLocalDateFromString(compra.dataEmissao || compra.data));
    setItensCompra(
      compra.itens.map(item => ({
        insumoId: item.insumoId,
        unidades: 0,
        pesoPorUnidade: 0,
        precoUnitario: item.custoUnitario,
        quantidadeGramas: item.quantidadeGramas,
        custoTotal: item.custoTotal
      }))
    );
    setExibirFormulario(true);
  };

  const salvarEdicao = async () => {
    if (!compraEmEdicao) return;
    
    if (!fornecedorId || itensCompra.length === 0) {
      exibirFeedback("erro", "Preencha fornecedor e adicione itens.");
      return;
    }

    const itensValidos = CompraService.converterItensParaCompra(itensCompra);
    if (!itensValidos.length) {
      exibirFeedback("erro", "Adicione itens válidos.");
      return;
    }

    const compraEditada: Compra = {
      id: compraEmEdicao.id,
      fornecedor: sanitize(fornecedorId),
      data: localDateToISO(dataCompra),
      dataEmissao: dataEmissao ? localDateToISO(dataEmissao) : undefined,
      tipoDocumento,
      numeroNota: numeroNota ? sanitize(numeroNota) : undefined,
      confirmado: true,
      dataConfirmacao: compraEmEdicao.dataConfirmacao,
      itens: itensValidos
    };

    const { valida, erros } = CompraService.validarCompra(compraEditada);
    if (!valida) {
      exibirFeedback("erro", erros.join(", "));
      return;
    }

    try {
      setLoading(true);
      const { sucesso, erro } = await CompraService.editarCompra(compraEmEdicao.id, compraEditada, { role: "admin" });
      
      if (sucesso) {
        setFornecedorId("");
        setNumeroNota("");
        setItensCompra([]);
        setDataCompra(getLocalDateString());
        setDataEmissao(getLocalDateString());
        setCompraEmEdicao(null);
        setExibirFormulario(false);
        await useConfeitariaStore.getState().carregarDadosFirebase();
        exibirFeedback("sucesso", "Compra editada com sucesso.");
      } else {
        exibirFeedback("erro", erro || "Falha ao editar.");
      }
    } catch {
      exibirFeedback("erro", "Erro ao editar compra.");
    } finally {
      setLoading(false);
    }
  };

  const cancelarCompraHandler = async (compraId: string) => {
    if (!window.confirm("🔴 Tem certeza que deseja cancelar esta compra?")) {
      return;
    }

    try {
      setLoading(true);
      const { sucesso, erro } = await CompraService.cancelarCompra(compraId, { role: "admin" });
      
      if (sucesso) {
        await useConfeitariaStore.getState().carregarDadosFirebase();
        exibirFeedback("sucesso", "Compra cancelada com sucesso.");
      } else {
        exibirFeedback("erro", erro || "Falha ao cancelar.");
      }
    } catch {
      exibirFeedback("erro", "Erro ao cancelar compra.");
    } finally {
      setLoading(false);
    }
  };

  const salvarCompra = async () => {
    if (!fornecedorId || itensCompra.length === 0) {
      exibirFeedback("erro", "Preencha fornecedor e adicione itens.");
      return;
    }

    if (!compraEmEdicao && CompraService.verificarNotaDuplicada(numeroNota, compras, tipoDocumento)) {
      exibirFeedback("erro", "Nota fiscal já existe.");
      return;
    }

    const itensValidos = CompraService.converterItensParaCompra(itensCompra);
    if (!itensValidos.length) {
      exibirFeedback("erro", "Adicione itens válidos.");
      return;
    }

    if (compraEmEdicao) {
      return salvarEdicao();
    }

    const novaCompra = {
      id: crypto.randomUUID(),
      fornecedor: sanitize(fornecedorId),
      data: localDateToISO(dataCompra),
      dataEmissao: dataEmissao ? localDateToISO(dataEmissao) : undefined,
      tipoDocumento,
      numeroNota: numeroNota ? sanitize(numeroNota) : undefined,
      confirmado: true,
      dataConfirmacao: new Date().toISOString(),
      itens: itensValidos
    };

    const { valida, erros } = CompraService.validarCompra(novaCompra);
    if (!valida) {
      exibirFeedback("erro", erros.join(", "));
      return;
    }

    try {
      setLoading(true);
      const { sucesso, erro } = await CompraService.registrarCompraCompleta(novaCompra);
      
      if (sucesso) {
        setFornecedorId("");
        setNumeroNota("");
        setItensCompra([]);
        setDataCompra(getLocalDateString());
        setDataEmissao(getLocalDateString());
        setExibirFormulario(false);
        await useConfeitariaStore.getState().carregarDadosFirebase();
        exibirFeedback("sucesso", "Compra registrada com sucesso.");
      } else {
        exibirFeedback("erro", erro || "Falha ao registrar.");
      }
    } catch {
      exibirFeedback("erro", "Erro ao salvar compra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
          🧾 Compras de Insumos
        </h1>
        <p style={{ color: theme.colors.background }}>
          Gerencie entradas de mercadoria e atualize estoque • {compras.length} compras registradas
        </p>
      </div>

      {feedback && (
        <div
          className="mb-6 rounded-lg p-3 text-sm font-semibold"
          style={{
            backgroundColor:
              feedback.tipo === "sucesso"
                ? theme.colors.success
                : feedback.tipo === "erro"
                  ? theme.colors.danger
                  : theme.colors.info,
            color: theme.colors.background,
          }}
        >
          {feedback.mensagem}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { 
            icon: "💰", 
            label: "Total Hoje", 
            value: `R$ ${dashboard.totalHoje.toFixed(2)}`, 
            sub: `${dashboard.comprasHoje} compra(s)` 
          },
          { 
            icon: "📊", 
            label: "Total Mês", 
            value: `R$ ${dashboard.totalMes.toFixed(2)}`, 
            sub: `${dashboard.comprasMes} compra(s)` 
          },
          { 
            icon: "📅", 
            label: "Última Compra", 
            value: dashboard.ultimaCompra ? new Date(dashboard.ultimaCompra.data).toLocaleDateString("pt-BR") : "—", 
            sub: dashboard.ultimaCompra?.fornecedor || "Sem compras" 
          },
          { 
            icon: "🏆", 
            label: "Fornecedor Frequente", 
            value: dashboard.fornecedorFrequente || "—", 
            sub: "Mais compras" 
          }
        ].map(({ icon, label, value, sub }, i) => (
          <div key={i} className="p-4 rounded-lg shadow-md" style={{ backgroundColor: theme.colors.background }}>
            <p className="text-sm font-semibold" style={{ color: theme.colors.border }}>
              {icon} {label}
            </p>
            <p className="text-2xl font-bold mt-1 truncate" style={{ color: theme.colors.primary }}>
              {value}
            </p>
            <p className="text-xs mt-1" style={{ color: theme.colors.border }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {exibirFormulario && (
        <div className="p-6 rounded-lg shadow-md mb-8" style={{ backgroundColor: theme.colors.background }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold" style={{ color: theme.colors.primaryLight }}>
              {compraEmEdicao ? "✏️ Editar Compra" : "➕ Nova Compra"}
            </h2>
            <button 
              onClick={() => {
                setExibirFormulario(false);
                setCompraEmEdicao(null);
                setFornecedorId("");
                setNumeroNota("");
                setItensCompra([]);
                setDataCompra(getLocalDateString());
                setDataEmissao(getLocalDateString());
              }}
              disabled={loading}
              className="text-sm px-3 py-1 rounded disabled:opacity-50" 
              style={{ backgroundColor: theme.colors.border, color: theme.colors.primary }}
            >
              fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
                Fornecedor
              </label>
              <input 
                type="text" 
                value={fornecedorId} 
                onChange={e => validateInput(e.target.value, 100) && setFornecedorId(e.target.value)} 
                placeholder="Digite o nome do fornecedor" 
                className="w-full p-2 rounded border" 
                style={{ borderColor: theme.colors.border }} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
                Tipo de Documento
              </label>
              <select 
                value={tipoDocumento} 
                onChange={e => setTipoDocumento(e.target.value as "manual" | "nfe" | "nfce")} 
                className="w-full p-2 rounded border" 
                style={{ borderColor: theme.colors.border }}
              >
                <option value="manual">Compra Manual</option>
                <option value="nfce">NFC-e</option>
                <option value="nfe">NF-e</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
                Data de Registro
              </label>
              <input 
                type="date" 
                value={dataCompra} 
                onChange={e => setDataCompra(e.target.value)} 
                className="w-full p-2 rounded border" 
                style={{ borderColor: theme.colors.border }} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
                Data de Emissão {tipoDocumento !== "manual" && <span style={{ color: theme.colors.danger }}>*</span>}
              </label>
              <input 
                type="date" 
                value={dataEmissao} 
                onChange={e => setDataEmissao(e.target.value)} 
                className="w-full p-2 rounded border" 
                style={{ borderColor: theme.colors.border }} 
              />
            </div>

            {tipoDocumento !== "manual" && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
                  Número da Nota
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: 123456" 
                  value={numeroNota} 
                  onChange={e => validateInput(e.target.value, 50) && setNumeroNota(e.target.value)} 
                  className="w-full p-2 rounded border" 
                  style={{ borderColor: theme.colors.border }} 
                />
              </div>
            )}
          </div>

          <div className="mt-6 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h3 className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                Itens da Compra
              </h3>
              <button
                onClick={() => setMostrarNovoInsumo(true)}
                className="px-3 py-1 rounded text-sm font-semibold hover:opacity-90"
                style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
              >
                + Novo Insumo
              </button>
            </div>

            {mostrarNovoInsumo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}>
                <div className="w-full max-w-3xl rounded-lg shadow-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: theme.colors.border }}>
                    <h4 className="font-semibold" style={{ color: theme.colors.primary }}>Cadastrar novo insumo</h4>
                    <button
                      onClick={() => setMostrarNovoInsumo(false)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: theme.colors.border, color: theme.colors.primary }}
                    >
                      fechar
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={novoInsumo.nome}
                        onChange={e => setNovoInsumo(prev => ({ ...prev, nome: e.target.value }))}
                        className="p-2 rounded border"
                        style={{ borderColor: theme.colors.border }}
                      />

                      <select
                        value={novoInsumo.categoria}
                        onChange={e => setNovoInsumo(prev => ({ ...prev, categoria: e.target.value as "insumo" | "embalagem" }))}
                        className="p-2 rounded border"
                        style={{ borderColor: theme.colors.border }}
                      >
                        <option value="insumo">Insumo</option>
                        <option value="embalagem">Embalagem</option>
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Peso Embalagem (g)"
                        value={novoInsumo.pesoEmbalagemGramas ?? 0}
                        onChange={e => setNovoInsumo(prev => ({ ...prev, pesoEmbalagemGramas: Number(e.target.value) }))}
                        className="p-2 rounded border"
                        style={{ borderColor: theme.colors.border }}
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Preco Embalagem (R$)"
                        value={novoInsumo.precoEmbalagem ?? 0}
                        onChange={e => setNovoInsumo(prev => ({ ...prev, precoEmbalagem: Number(e.target.value) }))}
                        className="p-2 rounded border"
                        style={{ borderColor: theme.colors.border }}
                      />

                      <input
                        type="number"
                        min="0"
                        placeholder="Estoque Embalagens"
                        value={novoInsumo.estoqueEmbalagens ?? 0}
                        onChange={e => setNovoInsumo(prev => ({ ...prev, estoqueEmbalagens: Number(e.target.value) }))}
                        className="p-2 rounded border"
                        style={{ borderColor: theme.colors.border }}
                      />

                      <input
                        type="number"
                        min="0"
                        placeholder="Minimo (g)"
                        value={novoInsumo.minimoGramas ?? 1000}
                        onChange={e => setNovoInsumo(prev => ({ ...prev, minimoGramas: Number(e.target.value) }))}
                        className="p-2 rounded border"
                        style={{ borderColor: theme.colors.border }}
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={salvarNovoInsumo}
                        disabled={salvandoInsumo}
                        className="px-4 py-2 rounded font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: theme.colors.success }}
                      >
                        {salvandoInsumo ? "⏳ Salvando..." : "Salvar Insumo"}
                      </button>
                      <button
                        onClick={resetNovoInsumo}
                        className="px-4 py-2 rounded font-semibold"
                        style={{ backgroundColor: theme.colors.border, color: theme.colors.primary }}
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}>
                    <th className="text-left p-2" style={{ color: theme.colors.primary }}>Insumo</th>
                    <th className="text-right p-2" style={{ color: theme.colors.primary }}>Unidades</th>
                    <th className="text-right p-2" style={{ color: theme.colors.primary }}>Peso/Un (g)</th>
                    <th className="text-right p-2" style={{ color: theme.colors.primary }}>Preço/Un (R$)</th>
                    <th className="text-right p-2" style={{ color: theme.colors.primary }}>Quantidade (g)</th>
                    <th className="text-right p-2" style={{ color: theme.colors.primary }}>Custo Total (R$)</th>
                    <th className="text-right p-2" style={{ color: theme.colors.primary }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {itensCompra.map((item, i) => (
                    <tr key={i} style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}>
                      <td className="p-2">
                        <select 
                          value={item.insumoId} 
                          onChange={e => atualizarItem(i, "insumoId", e.target.value)} 
                          className="p-1 rounded border text-xs" 
                          style={{ borderColor: theme.colors.border }}
                        >
                          <option value="">Selecione</option>
                          {insumosOrdenados.map(ins => (
                            <option key={ins.id} value={ins.id}>{ins.nome}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input 
                          type="number" 
                          placeholder="0" 
                          min="0" 
                          step="1" 
                          value={item.unidades || ""} 
                          onChange={e => atualizarItem(i, "unidades", Number(e.target.value))} 
                          className="w-20 p-1 rounded border text-xs" 
                          style={{ borderColor: theme.colors.border }} 
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input 
                          type="number" 
                          placeholder="0" 
                          min="0" 
                          step="0.1" 
                          value={item.pesoPorUnidade || ""} 
                          onChange={e => atualizarItem(i, "pesoPorUnidade", Number(e.target.value))} 
                          className="w-20 p-1 rounded border text-xs" 
                          style={{ borderColor: theme.colors.border }} 
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          min="0" 
                          step="0.01" 
                          value={item.precoUnitario || ""} 
                          onChange={e => atualizarItem(i, "precoUnitario", Number(e.target.value))} 
                          className="w-20 p-1 rounded border text-xs" 
                          style={{ borderColor: theme.colors.border }} 
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={item.quantidadeGramas || ""} 
                          readOnly 
                          className="w-20 p-1 rounded border text-xs bg-gray-100" 
                          style={{ borderColor: theme.colors.border, backgroundColor: '#f3f4f6' }} 
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01" 
                          value={item.custoTotal || ""} 
                          readOnly 
                          className="w-20 p-1 rounded border text-xs bg-gray-100" 
                          style={{ borderColor: theme.colors.border, backgroundColor: '#f3f4f6' }} 
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button 
                          onClick={() => removerItem(i)} 
                          className="p-1 rounded hover:opacity-75" 
                          style={{ backgroundColor: theme.colors.danger, color: "white" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {itensCompra.length === 0 && (
              <p className="text-center py-4" style={{ color: theme.colors.border }}>
                Nenhum item adicionado
              </p>
            )}
          </div>

          <div className="flex gap-4 items-center justify-between">
            <button 
              onClick={adicionarItem} 
              className="flex items-center gap-2 px-4 py-2 rounded font-semibold hover:opacity-90" 
              style={{ backgroundColor: theme.colors.primaryDark, color: "white" }}
            >
              <Plus size={18} /> Adicionar Item
            </button>

            <div className="text-right">
              <p className="text-sm mb-1" style={{ color: theme.colors.border }}>
                Total da Compra ({itensCompra.length} itens)
              </p>
              <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                {(() => {
                  const total = itensCompra.reduce((sum, item) => {
                    const custo = Number(item.custoTotal) || 0;
                    return sum + custo;
                  }, 0);
                  return `R$ ${total.toFixed(2).replace('.', ',')}`;
                })()}
              </p>
            </div>
          </div>

          <button 
            onClick={salvarCompra} 
            disabled={!fornecedorId || itensCompra.length === 0 || loading} 
            className="px-6 py-2 rounded font-bold text-white hover:opacity-90 disabled:opacity-50 mt-4" 
            style={{ backgroundColor: theme.colors.success }}
          >
            {loading ? "⏳ Processando..." : compraEmEdicao ? "💾 Salvar Edição" : "💾 Confirmar Compra"}
          </button>
        </div>
      )}

      {!exibirFormulario && (
        <button 
          onClick={() => setExibirFormulario(true)} 
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold mb-8 hover:opacity-90" 
          style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
        >
          <Plus size={20} /> Nova Compra
        </button>
      )}

      <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primary }}>
          📚 Histórico de Compras
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-semibold mb-1 block" style={{ color: theme.colors.primary }}>
              Filtrar por Data
            </label>
            <input 
              type="date" 
              value={filtroData} 
              onChange={e => setFiltroData(e.target.value)} 
              className="w-full p-2 rounded border" 
              style={{ borderColor: theme.colors.border }} 
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block" style={{ color: theme.colors.primary }}>
              Filtrar por Fornecedor
            </label>
            <input 
              type="text" 
              placeholder="Digite o nome..." 
              value={filtroFornecedor} 
              onChange={e => setFiltroFornecedor(e.target.value)} 
              className="w-full p-2 rounded border" 
              style={{ borderColor: theme.colors.border }} 
            />
          </div>
        </div>

        {comprasFiltradas.length === 0 ? (
          <p style={{ color: theme.colors.border }} className="text-center py-6">
            Nenhuma compra encontrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 2 }}>
                  <th className="text-left p-2" style={{ color: theme.colors.primary }}>Fornecedor</th>
                  <th className="text-left p-2 text-xs" style={{ color: theme.colors.primary }}>Emissão</th>
                  <th className="text-left p-2 text-xs" style={{ color: theme.colors.primary }}>Entrada</th>
                  <th className="text-center p-2" style={{ color: theme.colors.primary }}>Itens</th>
                  <th className="text-right p-2" style={{ color: theme.colors.primary }}>Total</th>
                  <th className="text-center p-2" style={{ color: theme.colors.primary }}>Nota</th>
                  <th className="text-center p-2" style={{ color: theme.colors.primary }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.map(c => {
                  const totalCompra = c.itens.reduce((sum, item) => sum + item.custoTotal, 0);
                  const isCancelada = c.status === "cancelada";
                  return (
                    <tr key={c.id} style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1, opacity: isCancelada ? 0.5 : 1 }}>
                      <td className="p-2 font-semibold">{c.fornecedor}</td>
                      <td className="p-2 text-sm">{c.dataEmissao ? new Date(c.dataEmissao).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="p-2 text-sm">{new Date(c.data).toLocaleDateString("pt-BR")}</td>
                      <td className="p-2 text-center">{c.itens.length}</td>
                      <td className="p-2 text-right font-bold">R$ {totalCompra.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <span 
                          className="text-xs px-2 py-1 rounded" 
                          style={{ 
                            backgroundColor: c.numeroNota ? theme.colors.success : theme.colors.border, 
                            color: "white" 
                          }}
                        >
                          {c.numeroNota ? `#${c.numeroNota}` : "Manual"}
                        </span>
                      </td>
                      <td className="p-2 text-center flex gap-2 justify-center">
                        {!isCancelada && (
                          <>
                            <button 
                              onClick={() => carregarParaEdicao(c)}
                              disabled={loading}
                              className="p-2 rounded hover:opacity-75 disabled:opacity-50" 
                              style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}
                              title="Editar compra"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => cancelarCompraHandler(c.id)}
                              disabled={loading}
                              className="p-2 rounded hover:opacity-75 disabled:opacity-50" 
                              style={{ backgroundColor: theme.colors.danger, color: "white" }}
                              title="Cancelar compra"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {isCancelada && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: theme.colors.border, color: "white" }}>
                            Cancelada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
