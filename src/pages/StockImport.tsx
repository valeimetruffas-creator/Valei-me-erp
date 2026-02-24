import React from "react";
import * as XLSX from "xlsx";

interface Product {
  id?: string;
  name: string;
  stock: number;
  price?: number;
  category?: "insumo" | "embalagem";
}

interface Props {
  onImport: (newProducts: Product[]) => void;
  currentProducts: Product[]; // produtos já existentes no estado
}

export default function StockImport({ onImport, currentProducts }: Props) {
  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      const importedProducts: Product[] = json.map((item) => ({
        name: String(item["Ingrediente"]).trim(),
        stock: Number(item["Q.t da embalagem"]) || 0,
        price: Number(item["Preço"]) || 0,
        category:
          String(item["Categoria"]).toLowerCase().includes("embala") ? "embalagem" : "insumo",
      }));

      // Atualizar ou adicionar produtos
      const updatedProducts: Product[] = [...currentProducts];

      importedProducts.forEach((imported) => {
        const index = updatedProducts.findIndex(
          (p) => p.name.toLowerCase() === imported.name.toLowerCase()
        );

        if (index >= 0) {
          // Atualiza dados
          updatedProducts[index] = {
            ...updatedProducts[index],
            stock: imported.stock,
            price: imported.price,
            category: imported.category,
          };
        } else {
          // Adiciona novo produto
          updatedProducts.push(imported);
        }
      });

      onImport(updatedProducts);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <label className="block mb-1 font-medium">Importar estoque (Excel)</label>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFile}
        className="border p-2 rounded"
      />
    </div>
  );
}
