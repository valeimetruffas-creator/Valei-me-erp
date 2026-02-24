import React from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { theme } from "../styles/theme";

interface ProductImport {
  name: string;
  category: string;
  stock: number;
}

interface Props {
  onImport: (products: Partial<ProductImport>[]) => void;
}

export default function StockImport({ onImport }: Props) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          toast.error("Arquivo vazio ou colunas não reconhecidas.");
          return;
        }

        const produtosImportados: ProductImport[] = jsonData.map((item) => ({
          name: item["Produto"] || "Sem nome",
          category: item["Categoria"] || "Sem categoria",
          stock: parseInt(item["Quantidade"]) || 0,
        }));

        onImport(produtosImportados);
        toast.success("Produtos importados com sucesso!");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao importar. Verifique se o arquivo está correto.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <label className="block mb-2 font-semibold" style={{ color: theme.colors.primaryLight }}>
        Importar Excel (.xlsx):
      </label>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="block w-full p-2 border rounded"
        style={{ borderColor: theme.colors.primaryLight, color: theme.colors.primary }}
      />
    </div>
  );
}
