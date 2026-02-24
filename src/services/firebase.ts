import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";  

function getEnvValue(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (typeof value !== "string") {
    return "";
  }

  const sanitized = value
    .trim()
    .replace(/^["'`\s]+/, "")
    .replace(/["'`,\s]+$/, "");

  if (sanitized !== value.trim()) {
    console.warn(`[Firebase] Valor sanitizado para ${key}. Verifique seu .env para remover caracteres extras.`);
  }

  return sanitized;
}

const firebaseConfig = {
  apiKey: getEnvValue("VITE_FIREBASE_API_KEY"),
  authDomain: getEnvValue("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvValue("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvValue("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvValue("VITE_FIREBASE_APP_ID"),
};

const missingEnv = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length > 0) {
  console.error(
    `Configuração Firebase incompleta. Defina as variáveis de ambiente VITE_FIREBASE_* ausentes: ${missingEnv.join(", ")}`,
  );
}

// Inicializa uma única instância (evita duplicação em HMR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Serviços que seu sistema usa
export const db = getFirestore(app);     // Banco de dados
export const auth = getAuth(app);        // Login
export const storage = getStorage(app);  // Arquivos (imagens, etc)
export const functions = getFunctions(app, getEnvValue("VITE_FIREBASE_FUNCTIONS_REGION") || "us-central1"); // 🔥 CLOUD FUNCTIONS

export default app;
