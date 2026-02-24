// ✅ CreateProduct.tsx - Cadastro e Edição de Produtos
import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

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
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingProduct: Product | null = location.state?.product || null;

  const [formData, setFormData] = useState({
    name: editingProduct?.name || "",
    description: editingProduct?.description || "",
    price: editingProduct?.price.toString() || "",
    category: editingProduct?.category || "",
    photo: editingProduct?.photo || "",
    available: editingProduct?.available ?? true,
    ingredients: editingProduct?.ingredients || "",
    stock: editingProduct?.stock.toString() || ""
  });

  const categories = [
    "Bolo", "Docinho", "Torta", "Trufa", "Brigadeiro", "Cupcake", "Biscoito", "Brownie",
    "Cheesecake", "Pão de Mel", "Bombom", "Outros"
  ];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, price, category, stock } = formData;
    if (!name || !price || !category || !stock) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (Number.parseFloat(price) <= 0 || Number.parseInt(stock) < 0) {
      toast.error("Preço deve ser maior que zero e estoque não pode ser negativo.");
      return;
    }

    const newProduct: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      category: formData.category,
      photo: formData.photo,
      available: formData.available,
      ingredients: formData.ingredients,
      sales: editingProduct?.sales || 0,
      stock: Number.parseInt(formData.stock)
    };

    const storageKey = "valeime-confeitaria-products";
    const existing = localStorage.getItem(storageKey);
    const products: Product[] = existing ? JSON.parse(existing) : [];

    const updated = editingProduct
      ? products.map(p => (p.id === editingProduct.id ? newProduct : p))
      : [...products, newProduct];

    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success(editingProduct ? "Produto atualizado com sucesso!" : "Produto cadastrado!");
    setTimeout(() => navigate("/produtos"), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center px-4 pt-20 pb-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 p-6 rounded-lg shadow-md w-full max-w-xl space-y-4 border border-[#ebded0]"
      >
        <h1 className="text-2xl font-bold text-[#b2458a] text-center">
          {editingProduct ? "Editar Produto" : "Cadastro de Produto"}
        </h1>

        <input
          type="text"
          placeholder="Nome do produto"
          value={formData.name}
          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <textarea
          placeholder="Descrição"
          value={formData.description}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
          rows={2}
        />

        <textarea
          placeholder="Ingredientes"
          value={formData.ingredients}
          onChange={e => setFormData(p => ({ ...p, ingredients: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
          rows={2}
        />

        <input
          type="number"
          placeholder="Preço (R$)"
          value={formData.price}
          onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <select
          value={formData.category}
          onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
          required
        >
          <option value="">Selecione a categoria</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Estoque"
          value={formData.stock}
          onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="w-full px-4 py-2 border rounded bg-white"
        />

        {formData.photo && (
          <img
            src={formData.photo}
            alt="Preview"
            className="w-full h-40 object-cover rounded"
          />
        )}

        <button
          type="submit"
          className="w-full bg-[#b2458a] text-white font-bold py-2 rounded hover:bg-[#a12f75] transition"
        >
          {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
        </button>
      </form>
    </div>
  );
}
