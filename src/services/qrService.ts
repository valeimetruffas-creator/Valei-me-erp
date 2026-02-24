// src/services/qrService.ts

import axios from "axios";

// URL da WebmaniaBR - ajuste se necessário
const BASE_URL = "https://webmaniabr.com/api/1/nfe/consulta/qr-code/";

// ⚙️ Configure essas variáveis no seu .env e acesse usando import.meta.env
const HEADERS = {
  "Content-Type": "application/json",
  "X-Consumer-Key": import.meta.env.VITE_WEBMANIA_CONSUMER_KEY,
  "X-Consumer-Secret": import.meta.env.VITE_WEBMANIA_CONSUMER_SECRET,
  "X-Access-Token": import.meta.env.VITE_WEBMANIA_ACCESS_TOKEN,
};

export interface WebmaniaResponse {
  uuid: string;
  status: string;
  chave: string;
  nota_valida: boolean;
  data_emissao?: string;
  total?: string;
  emitente?: { xNome: string }[];
  det?: any[];
}

/**
 * Consulta a Sefaz através do WebmaniaBR usando o QR Code.
 * @param qrcodeUrl URL completa do QR Code NFC-e (normalmente obtida da leitura)
 * @param estado UF do emitente (ex: "SP", "RJ")
 */
export async function consultaQrCode(qrcodeUrl: string, estado: string): Promise<WebmaniaResponse> {
  const response = await axios.post(
    BASE_URL,
    { qrcode: qrcodeUrl, estado },
    { headers: HEADERS }
  );

  return response.data;
}

// ✅ Pronto para ser usado no frontend:
// import { consultaQrCode } from "../services/qrService";
// const data = await consultaQrCode(decodedText, "SP");
