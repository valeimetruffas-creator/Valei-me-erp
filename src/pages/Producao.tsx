import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import PageWrapper from "../components/PageWrapper";
import { useCart } from "../contexts/CartContext";
import CartButton from "../components/CartButton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  photo: string;
  available: boolean;
  ingredients: string;
  sales: number;
  stock: number;
  optional?: string[];
}

const categories = [
  "Todos", "Bebida", "Biscoito", "Bolo no Pote", "Bombom no Pote", "Brigadeiro", "Brigadeiro de Colher", "Brownie", "Caseirinho", "Torta",
  "Copo da Felicidade", "Docinhos", "Mousse", "Pão de Mel", "Slice cake", "Tortinha", "Trufão", "Outros" 
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    photo: "",
    available: true,
    ingredients: "",
    stock: "",
    optional: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("valeime-confeitaria-products");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const updated = (parsed as Product[]).map((p) => ({
          ...p,
          ingredients: p.ingredients || "",
          sales: p.sales || 0,
          stock: p.stock || 0,
          optional: p.optional || [],
        }));
        setProducts(updated);
        setFilteredProducts(updated);
      }
    }
  }, []);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== "Todos") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchTerm) {
      const st = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(st) ||
        p.description.toLowerCase().includes(st) ||
        p.ingredients.toLowerCase().includes(st) ||
        p.optional?.some(opt => opt.toLowerCase().includes(st))
      );
    }
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

  const saveProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem("valeime-confeitaria-products", JSON.stringify(updated));
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const imported: Product[] = [];
      const errors: string[] = [];

      rows.forEach((row, idx) => {
        const line = idx + 2;
        const categoria = (row.categoria || row.category || "").toString().trim();
        const nome = (row["nome do produto"] || row.nome || row.name || "").toString().trim();
        const precoRaw = row.preço ?? row.preco ?? row.price;
        const quantidadeRaw = row.quantidade ?? row.stock ?? row.estoque;

        if (!categoria || !nome || precoRaw === undefined || quantidadeRaw === undefined) {
          errors.push(`Linha ${line}: campos obrigatórios ausentes.`);
          return;
        }

        if (!categories.includes(categoria)) {
          errors.push(`Linha ${line}: categoria inválida ("${categoria}").`);
          return;
        }

        const preco = parseFloat(
          precoRaw.toString().replace("R$", "").replace(",", ".").trim()
        );
        if (Number.isNaN(preco) || preco < 0) {
          errors.push(`Linha ${line}: preço inválido ("${precoRaw}").`);
          return;
        }

        const quantidade = parseInt(quantidadeRaw, 10);
        if (Number.isNaN(quantidade) || quantidade < 0) {
          errors.push(`Linha ${line}: quantidade inválida ("${quantidadeRaw}").`);
          return;
        }

        imported.push({
          id: `${Date.now()}-${idx}`,
          name: nome,
          description: "",
          price: preco,
          category: categoria,
          photo: "",
          available: true,
          ingredients: "",
          stock: quantidade,
          sales: 0,
          optional: [],
        });
      });

      if (errors.length) {
        alert("Erros encontrados:\n" + errors.join("\n"));
      }

      if (imported.length) {
        saveProducts([...products, ...imported]);
        alert(`${imported.length} produtos importados com sucesso!`);
      }

      e.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      photo: "",
      available: true,
      ingredients: "",
      stock: "",
      optional: "",
    });
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      category: formData.category,
      photo: formData.photo,
      available: formData.available,
      ingredients: formData.ingredients,
      stock: Number.parseInt(formData.stock),
      sales: editingProduct?.sales || 0,
      optional: formData.optional ? formData.optional.split(",").map(o => o.trim()) : [],
    };
    const updated = editingProduct
      ? products.map(p => (p.id === editingProduct.id ? productData : p))
      : [...products, productData];
    saveProducts(updated);
    resetForm();
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      category: p.category,
      photo: p.photo,
      available: p.available,
      ingredients: p.ingredients,
      stock: p.stock.toString(),
      optional: p.optional?.join(", ") || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Excluir este produto?")) {
      const updated = products.filter(p => p.id !== id);
      saveProducts(updated);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Todos");
  };

  const { addToCart } = useCart();

  const handleSale = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return alert("Produto não encontrado.");

    if (prod.stock <= 0) {
      return alert("Estoque insuficiente.");
    }

    addToCart(prod);

    const updated = products.map(p =>
      p.id === id ? { ...p, stock: p.stock - 1, sales: p.sales + 1 } : p
    );

    saveProducts(updated);
    alert(`${prod.name} adicionado ao carrinho. Venda registrada.`);
  };

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 my-4">
        <h1 className="text-3xl font-bold text-[#CDA85B]">Produtos</h1>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#676C3C] text-[#FDEDD2] px-4 py-2 rounded hover:bg-[#4f5428]"
          >
            Importar Excel
          </button>
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleExcelChange}
            className="hidden"
          />
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#CDA85B] text-[#784E23] px-4 py-2 rounded hover:bg-[#bda436]"
          >
            + Novo Produto
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 bg-[#676C3C] p-4 rounded">
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, descrição ou ingredientes"
          className="p-2 rounded w-full text-[#784E23]"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="p-2 rounded text-[#784E23]"
        >
          {categories.map(cat => <option key={cat}>{cat}</option>)}
        </select>
        <button
          onClick={clearFilters}
          className="bg-[#CDA85B] text-[#784E23] px-4 py-2 rounded hover:bg-[#bda436]"
        >
          Limpar Filtros
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {Object.entries(
          filteredProducts.reduce((acc, product) => {
            if (!acc[product.category]) acc[product.category] = [];
            acc[product.category].push(product);
            return acc;
          }, {} as Record<string, Product[]>)
        ).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-2xl font-bold text-[#CDA85B] mb-3">{category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(p => (
                <div key={p.id} className="bg-[#676C3C] text-[#FDEDD2] p-4 rounded shadow-lg">
                  {p.photo && (
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-full h-40 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-sm">R$ {p.price.toFixed(2)}</p>
                  <p className="text-xs">Estoque: {p.stock}</p>
                  <p className="text-xs">Vendas: {p.sales}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSale(p.id)}
                      className="bg-[#784E23] px-3 py-1 rounded hover:bg-[#5c3d1a]"
                    >
                      Vender
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      className="bg-[#676C3C] px-3 py-1 rounded hover:bg-[#545a2f]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#FDEDD2] p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-[#784E23]">{editingProduct ? "Editar Produto" : "Novo Produto"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Nome" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full p-2 border rounded text-[#784E23]" required />
              <textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full p-2 border rounded text-[#784E23]" />
              <input type="number" step="0.01" placeholder="Preço" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className="w-full p-2 border rounded text-[#784E23]" required />
              <input type="text" placeholder="Ingredientes" value={formData.ingredients} onChange={e => setFormData(p => ({ ...p, ingredients: e.target.value }))} className="w-full p-2 border rounded text-[#784E23]" />
              <input type="text" placeholder="Opcionais (separados por vírgula)" value={formData.optional} onChange={e => setFormData(p => ({ ...p, optional: e.target.value }))} className="w-full p-2 border rounded text-[#784E23]" />
              <input type="number" placeholder="Estoque" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} className="w-full p-2 border rounded text-[#784E23]" required />
              <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full p-2 border rounded text-[#784E23]" required>
                <option value="">Selecione uma categoria</option>
                {categories.filter(c => c !== "Todos").map(cat => <option key={cat}>{cat}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              {formData.photo && <img src={formData.photo} alt="Prévia" className="w-20 h-20 mt-2 object-cover rounded" />}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="bg-[#784E23] px-4 py-2 rounded text-[#FDEDD2]">Cancelar</button>
                <button type="submit" className="bg-[#CDA85B] text-[#784E23] px-4 py-2 rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <CartButton />
    </PageWrapper>
  );
}
