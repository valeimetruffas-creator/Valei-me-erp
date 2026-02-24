import React, { useState } from "react";
import { theme } from "../styles/theme";

export default function CupomReader({ onResult }: { onResult: (data: any) => void }) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Simulação simples de leitura XML (substituir por parser real)
    const reader = new FileReader();
    reader.onload = () => {
      const xmlText = reader.result as string;

      // Exemplo fictício de parsing: cria produto a partir do nome do arquivo
      const produto = {
        nome: selectedFile.name.replace(".xml", ""),
        quantidade: 3,
        preco: 7.5,
      };

      onResult({
        type: "xml",
        data: {
          fornecedor: "Fornecedor Exemplo",
          data: new Date().toISOString(),
          total: produto.preco * produto.quantidade,
          produtos: [produto],
        },
      });
    };

    reader.readAsText(selectedFile);
  };

  return (
    <div style={{ color: theme.colors.primaryDark }}>
      <p className="mb-2">Selecione o arquivo XML do cupom fiscal:</p>
      <input
        type="file"
        accept=".xml"
        onChange={handleFileChange}
        className="block mb-4"
      />
    </div>
  );
}
