import { Compra, ItemCompra } from "../types/Compra";
import {
  cancelarCompraSegura,
  editarCompraSegura,
  registrarCompraSegura,
} from "./backendService";

interface UsuarioAdmin {
  role?: string;
}

export interface ItemCompraTemp {
  insumoId: string;
  unidades: number;
  pesoPorUnidade: number;
  precoUnitario: number;
  quantidadeGramas: number;
  custoTotal: number;
}

export interface DashboardCompras {
  totalHoje: number;
  totalMes: number;
  comprasHoje: number;
  comprasMes: number;
  ultimaCompra: Compra | null;
  fornecedorFrequente: string | null;
}

export class CompraService {
  private static isAdmin(usuario?: UsuarioAdmin): boolean {
    return usuario?.role === "admin";
  }

  private static isSameDay(dataString: string, date: Date): boolean {
    const d1 = new Date(dataString);
    const d2 = new Date(date);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  private static parseCallableResponse(response: unknown): { sucesso: boolean; erro?: string } {
    const data = (response as { data?: unknown } | undefined)?.data;
    if (!data || typeof data !== "object") {
      return { sucesso: false, erro: "Resposta inválida do backend" };
    }

    const registro = data as { sucesso?: unknown; erro?: unknown };
    return {
      sucesso: registro.sucesso === true,
      erro: typeof registro.erro === "string" ? registro.erro : undefined,
    };
  }

  static async registrarCompraCompleta(compra: Compra): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      const resposta = await registrarCompraSegura({ compra });
      const dados = this.parseCallableResponse(resposta);
      if (dados.sucesso) {
        return { sucesso: true };
      }
      return { sucesso: false, erro: dados.erro || "Falha no backend" };
    } catch (error) {
      console.error("❌ Erro ao registrar compra:", error);
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }

  static async cancelarCompra(compraId: string, usuario: UsuarioAdmin): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      if (!this.isAdmin(usuario)) {
        return { sucesso: false, erro: "Apenas admin pode cancelar compra" };
      }

      const resposta = await cancelarCompraSegura({ compraId });
      const dados = this.parseCallableResponse(resposta);
      if (dados.sucesso) {
        return { sucesso: true };
      }

      return { sucesso: false, erro: dados.erro || "Falha ao cancelar compra" };
    } catch (error) {
      console.error("❌ Erro ao cancelar compra:", error);
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro ao cancelar compra"
      };
    }
  }

  static async editarCompra(compraId: string, novaCompra: Compra, usuario: UsuarioAdmin): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      if (!this.isAdmin(usuario)) {
        return { sucesso: false, erro: "Apenas admin pode editar compra" };
      }

      const resposta = await editarCompraSegura({ compraId, compra: novaCompra });
      const dados = this.parseCallableResponse(resposta);
      if (dados.sucesso) {
        return { sucesso: true };
      }

      return { sucesso: false, erro: dados.erro || "Falha ao editar compra" };
    } catch (error) {
      console.error("❌ Erro ao editar compra:", error);
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro ao editar compra"
      };
    }
  }

  static validarCompra(compra: Compra, insumos?: Array<{ id: string }>): { valida: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!compra.fornecedor?.trim()) {
      erros.push("Fornecedor é obrigatório");
    }

    if (!compra.itens?.length) {
      erros.push("Pelo menos um item é obrigatório");
    }

    compra.itens?.forEach((item, index) => {
      if (!item.insumoId) {
        erros.push(`Item ${index + 1}: Insumo não selecionado`);
      }
      if (item.quantidadeGramas <= 0) {
        erros.push(`Item ${index + 1}: Quantidade deve ser maior que zero`);
      }
      if (item.custoTotal <= 0) {
        erros.push(`Item ${index + 1}: Custo deve ser maior que zero`);
      }
      if (insumos && !insumos.find(insumo => insumo.id === item.insumoId)) {
        erros.push(`Item ${index + 1}: Insumo não encontrado`);
      }
    });

    return { valida: erros.length === 0, erros };
  }

  static verificarNotaDuplicada(numeroNota: string, compras: Compra[], tipoDocumento: string, compraIdIgnorar?: string): boolean {
    if (!numeroNota || tipoDocumento === "manual") return false;
    return compras.some(c => c.id !== compraIdIgnorar && c.numeroNota === numeroNota && c.tipoDocumento !== "manual" && c.status !== "cancelada");
  }

  static calcularTotalCompra(itens: ItemCompraTemp[]): number {
    return itens.reduce((total, item) => total + (Number(item.custoTotal) || 0), 0);
  }

  static calcularTotalCompras(compras: Compra[]): number {
    return compras
      .filter(c => c.status !== "cancelada")
      .reduce((sum, c) =>
        sum + c.itens.reduce((s, i) => s + (Number(i.custoTotal) || 0), 0),
      0);
  }

  static gerarDashboard(compras: Compra[]): DashboardCompras {
    const comprasValidas = compras.filter(c => c.status !== "cancelada");
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const comprasHoje = comprasValidas.filter(c => this.isSameDay(c.data, hoje));
    const comprasMes = comprasValidas.filter(c => new Date(c.data) >= inicioMes);

    const fornecedorFrequente = Object.entries(
      comprasValidas.reduce((acc, c) => ({ ...acc, [c.fornecedor]: (acc[c.fornecedor] || 0) + 1 }), {} as Record<string, number>)
    ).sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    return {
      totalHoje: this.calcularTotalCompras(comprasHoje),
      totalMes: this.calcularTotalCompras(comprasMes),
      comprasHoje: comprasHoje.length,
      comprasMes: comprasMes.length,
      ultimaCompra: comprasValidas[comprasValidas.length - 1] || null,
      fornecedorFrequente
    };
  }

  static filtrarCompras(compras: Compra[], filtroData: string, filtroFornecedor: string): Compra[] {
    return compras.filter(c =>
      c.status !== "cancelada" &&
      (!filtroData || this.isSameDay(c.data, new Date(filtroData))) &&
      (!filtroFornecedor || c.fornecedor.toLowerCase().includes(filtroFornecedor.toLowerCase()))
    );
  }

  static calcularItensCompra(item: ItemCompraTemp, campo: keyof ItemCompraTemp, valor: string | number): ItemCompraTemp {
    const novoItem = { ...item };
    
    // Atualiza o campo modificado
    if (campo === "insumoId") {
      novoItem.insumoId = String(valor);
    } else if (campo === "unidades") {
      novoItem.unidades = Number(valor) || 0;
    } else if (campo === "pesoPorUnidade") {
      novoItem.pesoPorUnidade = Number(valor) || 0;
    } else if (campo === "precoUnitario") {
      novoItem.precoUnitario = Number(valor) || 0;
    }

    // Recalcula campos derivados
    novoItem.quantidadeGramas = Math.round(novoItem.unidades * novoItem.pesoPorUnidade);
    novoItem.custoTotal = Math.round(novoItem.unidades * novoItem.precoUnitario * 100) / 100;

    return novoItem;
  }

  static converterItensParaCompra(itensTemp: ItemCompraTemp[]): ItemCompra[] {
    return itensTemp
      .filter(item => item.insumoId && item.unidades > 0 && item.pesoPorUnidade > 0 && item.precoUnitario > 0)
      .map(item => ({
        insumoId: item.insumoId,
        quantidadeGramas: item.quantidadeGramas,
        custoTotal: item.custoTotal,
        custoUnitario: item.custoTotal / item.quantidadeGramas,
        unidade: "grama" as const
      }));
  }
}