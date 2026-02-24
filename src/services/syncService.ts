import { carregarDoFirebase } from "./firebaseSync";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getTenantIdRequired } from "./tenantService";

interface SyncState {
  isSynced: boolean;
  lastSync: string;
  pendingSync: boolean;
}

const SYNC_KEY = "valeime-sync-state";

export class SyncService {
  private static limparDados(valor: any): any {
    if (valor === undefined || typeof valor === "function") return undefined;

    if (Array.isArray(valor)) {
      return valor
        .map(item => this.limparDados(item))
        .filter(item => item !== undefined);
    }

    if (valor && typeof valor === "object") {
      const resultado: Record<string, any> = {};
      Object.entries(valor).forEach(([chave, item]) => {
        const limpo = this.limparDados(item);
        if (limpo !== undefined) {
          resultado[chave] = limpo;
        }
      });
      return resultado;
    }

    return valor;
  }

  static extrairDadosConfeitaria(estado: any): any {
    if (!estado || typeof estado !== "object") return {};

    const campos = [
      "insumos",
      "fichas",
      "produtos",
      "compras",
      "vendas",
      "fornecedores",
      "cuponsFiscais",
      "producoes",
      "estoque",
      "categorias",
      "configuracoes",
      "producao",
      "lastUpdate"
    ];

    const dados: Record<string, any> = {};
    campos.forEach(campo => {
      if (Object.prototype.hasOwnProperty.call(estado, campo) && estado[campo] !== undefined) {
        dados[campo] = estado[campo];
      }
    });

    return dados;
  }

  static async salvarConfeitaria(dados: any): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      const empresaId = await getTenantIdRequired();
      const confeitariaRef = doc(db, "confeitaria", empresaId);
      const snap = await getDoc(confeitariaRef);
      const dadosExistentes = snap.exists() ? snap.data() : {};
      const dadosMesclados = { ...dadosExistentes, ...dados, empresaId };

      const dadosComFallback = {
        ...dadosMesclados,
        estoque: dadosMesclados.estoque ?? {},
        compras: dadosMesclados.compras ?? [],
        vendas: dadosMesclados.vendas ?? [],
        producao: dadosMesclados.producao ?? [],
        categorias: dadosMesclados.categorias ?? [],
        configuracoes: dadosMesclados.configuracoes ?? {}
      };

      const dadosLimpos = this.limparDados(dadosComFallback);

      if (snap.exists()) {
        await updateDoc(confeitariaRef, dadosLimpos);
      } else {
        await setDoc(confeitariaRef, dadosLimpos);
      }

      return { sucesso: true };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro ao salvar confeitaria"
      };
    }
  }
  private static getSyncState(): SyncState {
    const stored = localStorage.getItem(SYNC_KEY);
    return stored ? JSON.parse(stored) : {
      isSynced: false,
      lastSync: "",
      pendingSync: false
    };
  }

  private static setSyncState(state: SyncState) {
    localStorage.setItem(SYNC_KEY, JSON.stringify(state));
  }

  static async sincronizarLocalParaNuvem(dadosLocais: any): Promise<boolean> {
    try {
      const syncState = this.getSyncState();
      
      if (syncState.pendingSync) {
        return false;
      }

      this.setSyncState({ ...syncState, pendingSync: true });

      // Verificar se Firebase tem dados
      const dadosNuvem = await carregarDoFirebase("confeitaria");
      
      if (!dadosNuvem || Object.keys(dadosNuvem).length === 0) {
        const resultado = await this.salvarConfeitaria(this.extrairDadosConfeitaria(dadosLocais));
        if (!resultado.sucesso) {
          throw new Error(resultado.erro || "Erro ao salvar confeitaria");
        }
      } else {
        const dadosMesclados = this.mesclarDados(dadosLocais, dadosNuvem);
        const resultado = await this.salvarConfeitaria(this.extrairDadosConfeitaria(dadosMesclados));
        if (!resultado.sucesso) {
          throw new Error(resultado.erro || "Erro ao salvar confeitaria");
        }
      }

      this.setSyncState({
        isSynced: true,
        lastSync: new Date().toISOString(),
        pendingSync: false
      });

      return true;
    } catch (error) {
      console.warn("Falha na sincronização:", error);
      this.setSyncState({ ...this.getSyncState(), pendingSync: false });
      return false;
    }
  }

  private static mesclarDados(local: any, nuvem: any): any {
    const resultado = { ...nuvem };
    
    // Mesclar arrays mantendo IDs únicos
    const arrays = ['insumos', 'produtos', 'fichas', 'compras', 'vendas', 'fornecedores', 'cuponsFiscais'];
    
    arrays.forEach(key => {
      if (local[key] && nuvem[key]) {
        const idsNuvem = new Set(nuvem[key].map((item: any) => item.id));
        const novosItens = local[key].filter((item: any) => !idsNuvem.has(item.id));
        resultado[key] = [...nuvem[key], ...novosItens];
      } else if (local[key]) {
        resultado[key] = local[key];
      }
    });

    return resultado;
  }

  static async carregarDaNuvem(): Promise<any> {
    try {
      return await carregarDoFirebase("confeitaria");
    } catch (error) {
      console.warn("Falha ao carregar da nuvem:", error);
      return null;
    }
  }

  static isFirebaseDisponivel(): boolean {
    return navigator.onLine;
  }

  static needsSync(): boolean {
    const syncState = this.getSyncState();
    return !syncState.isSynced;
  }
}