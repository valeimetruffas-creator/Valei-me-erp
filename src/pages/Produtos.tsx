import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  Image,
  Link2,
  RefreshCw,
  Search,
  Filter,
  Package,
} from "lucide-react";
import { useConfeitariaStore } from "../store/useConfeitariaStore";
import { theme } from "../styles/theme";
import {
  criarProduto,
  calcularPrecoAutomaticoDaFicha,
  uploadImagemProdutoSeguro,
} from "../services/produtosService";
import { Produto } from "../types/Produto";

export default function Produtos() {
  const {
    produtos,
    fichas,
    insumos,
    updateProduto,
    addProduto,
    removeProduto,
    alternarAtivoStatusProduto,
    vincularFichaTecnicaProduto,
  } = useConfeitariaStore();

  // Estados locais
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [filterAtivo, setFilterAtivo] = useState<"todos" | "ativos" | "inativos">("todos");
  const [editandoProduto, setEditandoProduto] = useState<Produto | null>(null);
  const [mostradorModalEdicao, setMostradorModalEdicao] = useState(false);
  const [mostradorModalVinculacao, setMostradorModalVinculacao] = useState<string | null>(null);
  const [isNovoProduto, setIsNovoProduto] = useState(false);
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string>("");
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  const normalizarTexto = (texto: string) =>
    (texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    const termoBusca = normalizarTexto(searchTerm);

    return produtos.filter(p => {
      const alvoBusca = normalizarTexto(`${p.nome} ${p.categoria} ${p.descricao || ""}`);
      const matchSearch = !termoBusca || alvoBusca.includes(termoBusca);
      const matchCategoria = !filterCategoria || p.categoria === filterCategoria;
      const matchAtivo =
        filterAtivo === "todos" ||
        (filterAtivo === "ativos" && p.ativo) ||
        (filterAtivo === "inativos" && !p.ativo);

      return matchSearch && matchCategoria && matchAtivo;
    });
  }, [produtos, searchTerm, filterCategoria, filterAtivo]);

  // Categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set(
      produtos
        .map(p => (p.categoria || "").trim())
        .filter(Boolean)
    );
    return Array.from(cats).sort();
  }, [produtos]);

  useEffect(() => {
    return () => {
      if (previewImagem && previewImagem.startsWith("blob:")) {
        URL.revokeObjectURL(previewImagem);
      }
    };
  }, [previewImagem]);

  // Handlers
  const handleNovoProdu = () => {
    const novo = criarProduto({ ativo: true });
    setEditandoProduto(novo);
    setIsNovoProduto(true);
    setArquivoImagem(null);
    setPreviewImagem("");
    setMostradorModalEdicao(true);
  };

  const handleEditar = (produto: Produto) => {
    setEditandoProduto(produto);
    setIsNovoProduto(false);
    setArquivoImagem(null);
    setPreviewImagem(produto.imagemUrl || produto.foto || "");
    setMostradorModalEdicao(true);
  };

  const handleSalvar = async (): Promise<{ sucesso: boolean; erro?: string }> => {
    if (!editandoProduto) return { sucesso: false, erro: "Produto inválido" };

    setSalvandoProduto(true);

    try {
      let produtoParaSalvar = { ...editandoProduto };

      if (arquivoImagem) {
        const uploadResultado = await uploadImagemProdutoSeguro(arquivoImagem, produtoParaSalvar.id);
        if (!uploadResultado.sucesso || !uploadResultado.imagemUrl) {
          return {
            sucesso: false,
            erro:
              uploadResultado.erro ||
              "Não foi possível salvar a imagem. Verifique permissões do Firebase Storage.",
          };
        }

        produtoParaSalvar = {
          ...produtoParaSalvar,
          imagemUrl: uploadResultado.imagemUrl,
          foto: uploadResultado.imagemUrl,
        };
      }

      if (produtos.find(p => p.id === produtoParaSalvar.id)) {
        updateProduto(produtoParaSalvar);
      } else {
        addProduto(produtoParaSalvar);
      }

      setMostradorModalEdicao(false);
      setEditandoProduto(null);
      setIsNovoProduto(false);
      setArquivoImagem(null);
      setPreviewImagem("");

      return { sucesso: true };
    } catch (error: any) {
      return { sucesso: false, erro: error?.message || "Erro ao salvar produto" };
    } finally {
      setSalvandoProduto(false);
    }
  };

  const handleDeletar = (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar este produto?")) {
      removeProduto(id);
    }
  };

  const handleAlternarAtivo = (id: string) => {
    alternarAtivoStatusProduto(id);
  };

  const handleVincularFicha = (produtoId: string, fichaTecnicaId?: string) => {
    vincularFichaTecnicaProduto(produtoId, fichaTecnicaId);
    setMostradorModalVinculacao(null);
  };

  const handleAtualizarCusto = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    const ficha = fichas.find(f => f.id === produto.fichaTecnicaId);
    const produtoAtualizado = calcularPrecoAutomaticoDaFicha(produto, ficha, fichas, insumos);
    updateProduto(produtoAtualizado);
  };

  const handleSelecionarImagem = (file: File | null) => {
    try {
      setArquivoImagem(file);

      if (!file) {
        setPreviewImagem(editandoProduto?.imagemUrl || editandoProduto?.foto || "");
        return;
      }

      const novaPreview = URL.createObjectURL(file);
      setPreviewImagem(novaPreview);
    } catch {
      setPreviewImagem(editandoProduto?.imagemUrl || editandoProduto?.foto || "");
    }
  };

  return (
    <div className="w-full min-h-screen px-6 pt-20 pb-10" style={{ backgroundColor: theme.colors.primary }}>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.primaryLight }}>
          📦 Catálogo de Produtos
        </h1>
        <p style={{ color: theme.colors.background }}>
          Gerencie produtos prontos para venda • {produtos.length} produtos
        </p>
      </div>

      {/* Barra de Ações */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={handleNovoProdu}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.primaryLight,
            color: theme.colors.primary,
          }}
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Pesquisa */}
        <div className="relative">
          <Search size={20} style={{ position: "absolute", left: "12px", top: "12px", color: theme.colors.border }} />
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg"
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.primary,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
        </div>

        {/* Categoria */}
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="px-4 py-3 rounded-lg"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.primary,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <option value="">Todas categorias</option>
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterAtivo}
          onChange={(e) => setFilterAtivo(e.target.value as any)}
          className="px-4 py-3 rounded-lg"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.primary,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <option value="todos">Todos</option>
          <option value="ativos">Apenas Ativos</option>
          <option value="inativos">Apenas Inativos</option>
        </select>
      </div>

      {/* Categorias flutuantes */}
      <div
        className="mb-8 sticky top-20 z-20 rounded-xl p-3 backdrop-blur-sm"
        style={{ backgroundColor: `${theme.colors.background}E6`, border: `1px solid ${theme.colors.border}` }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategoria("")}
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: filterCategoria === "" ? theme.colors.primaryLight : theme.colors.border,
              color: filterCategoria === "" ? theme.colors.primary : theme.colors.primaryDark,
            }}
          >
            Todas
          </button>

          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategoria(cat)}
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: filterCategoria === cat ? theme.colors.primaryLight : theme.colors.border,
                color: filterCategoria === cat ? theme.colors.primary : theme.colors.primaryDark,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ backgroundColor: theme.colors.background }}
        >
          <Package size={64} style={{ color: theme.colors.border, margin: "0 auto 16px" }} />
          <p style={{ color: theme.colors.border, fontSize: "18px" }}>
            Nenhum produto encontrado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map(produto => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              ficha={fichas.find(f => f.id === produto.fichaTecnicaId)}
              onEditar={handleEditar}
              onDeletar={handleDeletar}
              onAlternarAtivo={handleAlternarAtivo}
              onVincular={() => setMostradorModalVinculacao(produto.id)}
              onAtualizarCusto={() => handleAtualizarCusto(produto.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      {mostradorModalEdicao && editandoProduto && (
        <ModalEdicaoProduto
          produto={editandoProduto}
          categorias={categorias}
          isNovoProduto={isNovoProduto}
          previewImagem={previewImagem}
          salvando={salvandoProduto}
          onAtualizar={(campo, valor) => {
            setEditandoProduto({ ...editandoProduto, [campo]: valor });
          }}
          onSelecionarImagem={handleSelecionarImagem}
          onSalvar={async () => {
            const resultado = await handleSalvar();
            if (!resultado.sucesso && resultado.erro) {
              alert(resultado.erro);
            }
          }}
          onFechar={() => {
            setMostradorModalEdicao(false);
            setEditandoProduto(null);
            setIsNovoProduto(false);
            setArquivoImagem(null);
            setPreviewImagem("");
          }}
        />
      )}

      {/* Modal de Vinculação de Ficha */}
      {mostradorModalVinculacao && (
        <ModalVinculacaoFicha
          fichas={fichas}
          onVincular={(fichaTecnicaId) => handleVincularFicha(mostradorModalVinculacao, fichaTecnicaId)}
          onDesvinciular={() => handleVincularFicha(mostradorModalVinculacao)}
          onFechar={() => setMostradorModalVinculacao(null)}
        />
      )}
    </div>
  );
}

// ====== CARD DE PRODUTO ======
function ProdutoCard({
  produto,
  ficha,
  onEditar,
  onDeletar,
  onAlternarAtivo,
  onVincular,
  onAtualizarCusto,
}: {
  produto: Produto;
  ficha?: any;
  onEditar: (p: Produto) => void;
  onDeletar: (id: string) => void;
  onAlternarAtivo: (id: string) => void;
  onVincular: () => void;
  onAtualizarCusto: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all overflow-hidden"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: produto.ativo ? theme.colors.success : theme.colors.danger,
            color: "white",
          }}
        >
          {produto.ativo ? "Ativo" : "Inativo"}
        </span>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: theme.colors.primaryLight,
            color: theme.colors.primary,
          }}
        >
          {produto.categoria}
        </span>
      </div>

      {/* Foto */}
      {produto.imagemUrl || produto.foto ? (
        <img
          src={produto.imagemUrl || produto.foto}
          alt={produto.nome}
          className="w-full h-40 object-cover rounded-lg mb-4"
        />
      ) : (
        <div
          className="w-full h-40 rounded-lg mb-4 flex items-center justify-center"
          style={{ backgroundColor: theme.colors.border, opacity: 0.3 }}
        >
          <Image size={40} style={{ color: theme.colors.border }} />
        </div>
      )}

      {/* Informações */}
      <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.primary }}>
        {produto.nome}
      </h3>

      <p style={{ color: theme.colors.border, fontSize: "14px", marginBottom: "12px", minHeight: "40px" }}>
        {produto.descricao || "Sem descrição"}
      </p>

      {/* Preço */}
      <div className="mb-3">
        <p style={{ color: theme.colors.border, fontSize: "12px" }}>Preço de Venda</p>
        <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
          R$ {produto.precoVenda.toFixed(2)}
        </p>
      </div>

      {/* Custo e Margem */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
        <div>
          <p style={{ color: theme.colors.border, fontSize: "11px" }}>Custo</p>
          <p style={{ color: theme.colors.primaryLight, fontSize: "14px", fontWeight: "bold" }}>
            R$ {(produto.custoFicha || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p style={{ color: theme.colors.border, fontSize: "11px" }}>Margem</p>
          <p style={{ color: theme.colors.primaryLight, fontSize: "14px", fontWeight: "bold" }}>
            {(produto.margemLucro || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Ficha Vinculada */}
      {produto.fichaTecnicaId && ficha ? (
        <p style={{ color: theme.colors.success, fontSize: "12px", marginBottom: "12px" }}>
          ✓ Vinculado a: {ficha.nome}
        </p>
      ) : (
        <p style={{ color: theme.colors.danger, fontSize: "12px", marginBottom: "12px" }}>
          ⚠ Sem ficha técnica vinculada
        </p>
      )}

      {/* Botões de Ação */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={() => onEditar(produto)}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.primaryLight,
            color: theme.colors.primary,
          }}
        >
          <Edit2 size={16} /> Editar
        </button>
        <button
          onClick={() => onAlternarAtivo(produto.id)}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg"
          style={{
            backgroundColor: produto.ativo ? theme.colors.warning : theme.colors.success,
            color: "white",
          }}
        >
          <Power size={16} /> {produto.ativo ? "Desativar" : "Ativar"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onVincular}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryLight,
          }}
        >
          <Link2 size={14} /> Vincular
        </button>
        <button
          onClick={() => onDeletar(produto.id)}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.danger,
            color: "white",
          }}
        >
          <Trash2 size={14} /> Deletar
        </button>
      </div>

      {/* Botão Atualizar Custo */}
      {produto.fichaTecnicaId && (
        <button
          onClick={onAtualizarCusto}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.success,
            color: "white",
          }}
        >
          <RefreshCw size={14} /> Atualizar Preço
        </button>
      )}
    </div>
  );
}

// ====== MODAL DE EDIÇÃO ======
function ModalEdicaoProduto({
  produto,
  categorias,
  isNovoProduto = false,
  previewImagem,
  salvando,
  onAtualizar,
  onSelecionarImagem,
  onSalvar,
  onFechar,
}: {
  produto: Produto;
  categorias: string[];
  isNovoProduto?: boolean;
  previewImagem: string;
  salvando: boolean;
  onAtualizar: (campo: string, valor: any) => void;
  onSelecionarImagem: (file: File | null) => void;
  onSalvar: () => Promise<void>;
  onFechar: () => void;
}) {
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");

  const handleCategoriaChange = (valor: string) => {
    if (valor === "NOVA") {
      setMostrarNovaCategoria(true);
    } else {
      onAtualizar("categoria", valor);
      setMostrarNovaCategoria(false);
    }
  };

  const handleAdicionarCategoria = () => {
    if (novaCategoria.trim()) {
      onAtualizar("categoria", novaCategoria.trim());
      setNovaCategoria("");
      setMostrarNovaCategoria(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-96 overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
          {isNovoProduto ? "➕ Novo Produto" : "✏️ Editar Produto"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
              Nome
            </label>
            <input
              type="text"
              value={produto.nome}
              onChange={(e) => onAtualizar("nome", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ borderColor: theme.colors.border }}
            />
          </div>

          {/* Categoria - Select com opção de criar nova */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
              Categoria
            </label>
            {isNovoProduto ? (
              // Para novo produto - começar com opção de criar ou escolher
              <>
                {!mostrarNovaCategoria && (
                  <select
                    value={produto.categoria === "Geral" ? "" : produto.categoria}
                    onChange={(e) => {
                      if (e.target.value === "NOVA") {
                        setMostrarNovaCategoria(true);
                        setNovaCategoria("");
                      } else {
                        onAtualizar("categoria", e.target.value);
                        setMostrarNovaCategoria(false);
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: theme.colors.border }}
                  >
                    <option value="">-- Selecione ou crie uma categoria --</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="NOVA" style={{ fontWeight: "bold", color: theme.colors.success }}>
                      ➕ Criar Nova Categoria
                    </option>
                  </select>
                )}

                {mostrarNovaCategoria && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Digite o nome da categoria"
                      value={novaCategoria}
                      onChange={(e) => setNovaCategoria(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: theme.colors.border }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleAdicionarCategoria();
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAdicionarCategoria}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: theme.colors.success }}
                      >
                        Usar Esta Categoria
                      </button>
                      <button
                        onClick={() => {
                          setMostrarNovaCategoria(false);
                          setNovaCategoria("");
                        }}
                        className="px-3 py-2 rounded-lg text-sm font-semibold"
                        style={{
                          backgroundColor: theme.colors.border,
                          color: theme.colors.primary,
                        }}
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Para edição - usar select normal
              <>
                <select
                  value={mostrarNovaCategoria ? "NOVA" : produto.categoria}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: theme.colors.border }}
                >
                  <option value="">-- Selecione uma categoria --</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="NOVA">+ Criar Nova Categoria</option>
                </select>

                {mostrarNovaCategoria && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite o nome da categoria"
                      value={novaCategoria}
                      onChange={(e) => setNovaCategoria(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: theme.colors.border }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleAdicionarCategoria();
                      }}
                    />
                    <button
                      onClick={handleAdicionarCategoria}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: theme.colors.success }}
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
              Preço de Venda (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={produto.precoVenda}
              onChange={(e) => onAtualizar("precoVenda", parseFloat(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ borderColor: theme.colors.border }}
            />
          </div>

          {/* Estoque Mínimo */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
              Estoque Mínimo
            </label>
            <input
              type="number"
              value={produto.estoqueMinimo || 0}
              onChange={(e) => onAtualizar("estoqueMinimo", parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ borderColor: theme.colors.border }}
            />
          </div>

        </div>

        {/* Descrição */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
            Descrição
          </label>
          <textarea
            value={produto.descricao || ""}
            onChange={(e) => onAtualizar("descricao", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border"
            style={{ borderColor: theme.colors.border }}
            rows={3}
          />
        </div>

        {/* Foto - Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
            Foto do Produto
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => onSelecionarImagem(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 rounded-lg border mb-2"
            style={{ borderColor: theme.colors.border }}
          />

          {(previewImagem || produto.imagemUrl || produto.foto) && (
            <div className="mb-2">
              <img
                src={previewImagem || produto.imagemUrl || produto.foto}
                alt="Preview"
                className="h-20 rounded-lg object-cover"
              />
            </div>
          )}

          {(produto.imagemUrl || produto.foto) && (
            <p className="text-xs mt-1" style={{ color: theme.colors.border }}>
              Imagem atual carregada. Selecione um novo arquivo para substituir.
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onFechar}
            className="px-6 py-2 rounded-lg font-semibold"
            style={{
              backgroundColor: theme.colors.border,
              color: theme.colors.primary,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              void onSalvar();
            }}
            disabled={salvando}
            className="px-6 py-2 rounded-lg font-semibold"
            style={{
              backgroundColor: theme.colors.success,
              color: "white",
              opacity: salvando ? 0.7 : 1,
            }}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== MODAL DE VINCULAÇÃO DE FICHA ======
function ModalVinculacaoFicha({
  fichas,
  onVincular,
  onDesvinciular,
  onFechar,
}: {
  fichas: any[];
  onVincular: (fichaTecnicaId: string) => void;
  onDesvinciular: () => void;
  onFechar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full max-h-96 overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
          🔗 Vincular Ficha Técnica
        </h2>

        {fichas.length === 0 ? (
          <p style={{ color: theme.colors.border }}>Nenhuma ficha técnica disponível</p>
        ) : (
          <div className="space-y-2 mb-6">
            {fichas.map(ficha => (
              <button
                key={ficha.id}
                onClick={() => onVincular(ficha.id)}
                className="w-full text-left px-4 py-3 rounded-lg transition-all hover:shadow-lg"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.primaryLight,
                }}
              >
                <p className="font-semibold">{ficha.nome}</p>
                <p className="text-sm opacity-80">Custo: R$ {(ficha.custoUnitario || 0).toFixed(2)}</p>
              </button>
            ))}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onDesvinciular}
            className="px-6 py-2 rounded-lg font-semibold"
            style={{
              backgroundColor: theme.colors.danger,
              color: "white",
            }}
          >
            Desvincular
          </button>
          <button
            onClick={onFechar}
            className="px-6 py-2 rounded-lg font-semibold"
            style={{
              backgroundColor: theme.colors.border,
              color: theme.colors.primary,
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
