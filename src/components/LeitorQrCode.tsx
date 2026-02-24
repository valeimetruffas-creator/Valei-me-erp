// src/components/LeitorQrCode.tsx

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { consultaQrCode } from "../services/qrService";

type Props = {
  onConfirm: (dados: any) => void;
  onClose: () => void;
};

export default function LeitorQrCode({ onConfirm, onClose }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [urlManual, setUrlManual] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const iniciarScanner = async () => {
    if (scannerRef.current) return;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;
    setCameraAtiva(true);

    try {
      await scanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: { width: 300, height: 300 } },
  async (decodedText) => {
    try {
      await scanner.pause();
      setLoading(true);
      setError("");
      await consultar(decodedText);
    } catch (err: any) {
      setError(err.message || "Erro na consulta");
      await scanner.resume();
    } finally {
      setLoading(false);
    }
  },
  (errorMessage) => {
    // Você pode tratar erros de leitura do QR Code aqui, se quiser
    // Exemplo: setError(errorMessage);
  }
);
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);
      setError("Erro ao iniciar câmera");
    }
  };

  const consultar = async (qrcodeUrl: string) => {
    try {
      setError("");
      setLoading(true);
      const estado = "SP";
      const data = await consultaQrCode(qrcodeUrl, estado);

      if (!data.nota_valida) throw new Error("Nota inválida");

      const produtos = data.det?.map((item: any) => ({
        nome: item.prod.xProd,
        quantidade: parseFloat(item.prod.qCom),
        preco: parseFloat(item.prod.vUnCom),
        categoria: "insumo",
      })) || [];

      onConfirm({
        fornecedor: data.emitente?.[0]?.xNome || "",
        data: data.data_emissao,
        chave: data.chave,
        produtos,
      });
    } catch (err: any) {
      setError(err.message || "Erro ao consultar QR Code");
    } finally {
      setLoading(false);
    }
  };

  const handleConsultaManual = async () => {
    if (!urlManual.trim()) {
      setError("Cole a URL completa do QR Code");
      return;
    }
    await consultar(urlManual);
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (
        scanner &&
        (scanner.getState() === 2 || scanner.getState() === 3) // 2 = STARTED, 3 = PAUSED
      ) 
      {
        scanner.stop().catch((err) => {
          console.warn("Erro ao parar scanner:", err.message);
        });
      }
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {!cameraAtiva && (
        <button
          onClick={iniciarScanner}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          📷 Ativar Câmera
        </button>
      )}

      <div id="reader" className="w-full max-w-xs rounded overflow-hidden border border-gray-300 shadow" />

      <div className="w-full max-w-xs text-center">
        <p className="text-sm text-gray-700 my-2">Ou cole a URL do QR Code abaixo:</p>
        <input
          type="text"
          placeholder="https://..."
          value={urlManual}
          onChange={(e) => setUrlManual(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <button
          onClick={handleConsultaManual}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
        >
          🔍 Consultar URL
        </button>
      </div>

      {loading && <p className="text-blue-600">🔄 Consultando Sefaz...</p>}
      {error && <p className="text-red-600 text-sm">❌ {error}</p>}

      <button
        onClick={onClose}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Voltar
      </button>
    </div>
  );
}
