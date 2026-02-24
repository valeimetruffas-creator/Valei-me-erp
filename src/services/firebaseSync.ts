import { doc, setDoc, getDoc, collection, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getTenantIdRequired } from "./tenantService";

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = "code" in error ? (error as { code?: unknown }).code : undefined;
  return maybeCode === "permission-denied";
}

// 🔥 MERGE INTELIGENTE - NÃO SOBRESCREVER DADOS LOCAIS RECENTES
function mergeComTimestamp(dadosLocais: any, dadosRemoto: any): any {
  if (!dadosRemoto) return dadosLocais;
  if (!dadosLocais) return dadosRemoto;
  
  const agora = new Date();
  const limite = new Date(agora.getTime() - 60000); // 1 minuto de proteção
  
  const resultado = { ...dadosRemoto };
  
  // Arrays que precisam de merge inteligente
  const arrays = ['compras', 'transacoes', 'insumos', 'vendas'];
  
  arrays.forEach(key => {
    if (dadosLocais[key] && dadosRemoto[key]) {
      const idsRemoto = new Set(dadosRemoto[key].map((item: any) => item.id));
      
      // Manter itens locais recentes que não estão no remoto
      const itensLocaisRecentes = dadosLocais[key].filter((item: any) => {
        const dataItem = new Date(item.dataAtualizacao || item.dataConfirmacao || item.data || 0);
        return !idsRemoto.has(item.id) && dataItem > limite;
      });
      
      // Combinar: remoto + locais recentes não duplicados
      resultado[key] = [...dadosRemoto[key], ...itensLocaisRecentes];
    } else if (dadosLocais[key]) {
      resultado[key] = dadosLocais[key];
    }
  });
  
  return resultado;
}

export async function salvarNoFirebase(colecao: string, dados: any) {
  try {
    const empresaId = await getTenantIdRequired();

    // Adicionar timestamp para controle de merge
    const dadosComTimestamp = {
      ...dados,
      empresaId,
      lastUpdate: serverTimestamp(),
      syncVersion: Date.now()
    };
    
    await setDoc(doc(db, colecao, empresaId), dadosComTimestamp, { merge: true });
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(`⚠️ Sem permissão para salvar ${colecao} no Firebase.`);
      throw error;
    }

    console.error(`❌ Erro ao salvar ${colecao} no Firebase:`, error);
    throw error;
  }
}

export async function carregarDoFirebase(colecao: string) {
  try {
    const empresaId = await getTenantIdRequired();

    const tenantRef = doc(db, colecao, empresaId);
    const snapTenant = await getDoc(tenantRef);
    if (snapTenant.exists()) {
      return snapTenant.data();
    }

    const legacyRef = doc(db, colecao, "dados");
    const legacySnap = await getDoc(legacyRef);
    if (!legacySnap.exists()) {
      return null;
    }

    const legacyData = legacySnap.data();
    await setDoc(tenantRef, {
      ...legacyData,
      empresaId,
      migradoDeLegacy: true,
      migradoEm: serverTimestamp(),
    }, { merge: true });

    return legacyData;
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(`⚠️ Sem permissão para carregar ${colecao} no Firebase.`);
      return null;
    }

    console.error(`❌ Erro ao carregar ${colecao} do Firebase:`, error);
    return null;
  }
}

// 🔥 CARREGAR COM MERGE INTELIGENTE
export async function carregarComMerge(colecao: string, dadosLocais: any) {
  const dadosRemoto = await carregarDoFirebase(colecao);
  return mergeComTimestamp(dadosLocais, dadosRemoto);
}

// 🔥 SINCRONIZAÇÃO SEGURA (EVITA RACE CONDITIONS)
export async function sincronizarSeguro(colecao: string, dadosLocais: any) {
  try {
    // 1. Carregar dados remotos
    const dadosRemoto = await carregarDoFirebase(colecao);
    
    // 2. Fazer merge inteligente
    const dadosMergeados = mergeComTimestamp(dadosLocais, dadosRemoto);
    
    // 3. Salvar resultado do merge
    await salvarNoFirebase(colecao, dadosMergeados);
    
    return dadosMergeados;
  } catch (error) {
    console.error(`❌ Erro na sincronização segura de ${colecao}:`, error);
    return dadosLocais; // Retorna dados locais em caso de erro
  }
}