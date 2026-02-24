import { CupomFiscal, ItemCupom, DadosSEFAZ } from "../types/CupomFiscal";
import { dadosLoja } from "../config/configLoja";

class CupomFiscalService {
  private static contador = 0;

  /**
   * Gera um número sequencial para o cupom
   */
  static gerarNumeroCupom(): number {
    this.contador++;
    return this.contador;
  }

  /**
   * Cria um novo cupom fiscal
   */
  static criarCupomFiscal(dados: {
    itens: ItemCupom[];
    desconto?: number;
    acrescimo?: number;
    formaPagamento: CupomFiscal["formaPagamento"];
    vendaId?: string;
  }): CupomFiscal {
    const subtotal = dados.itens.reduce((sum, item) => sum + item.valorTotal, 0);
    const desconto = dados.desconto || 0;
    const acrescimo = dados.acrescimo || 0;
    const total = subtotal - desconto + acrescimo;

    return {
      id: crypto.randomUUID(),
      numero: this.gerarNumeroCupom(),
      serie: 1,
      dataCupom: new Date().toISOString(),
      itens: dados.itens,
      subtotal,
      desconto,
      acrescimo,
      total,
      formaPagamento: dados.formaPagamento,
      status: "rascunho",
      vendaId: dados.vendaId
    };
  }

  /**
   * Formata cupom para impressão térmica (sem SEFAZ)
   */
  static formatarCupomParaImpressao(cupom: CupomFiscal): string {
    const largura = 40;
    const centro = (texto: string) => {
      const espacos = Math.max(0, Math.floor((largura - texto.length) / 2));
      return " ".repeat(espacos) + texto;
    };
    const linha = () => "=".repeat(largura);

    let cupomFormatado = "";

    // Cabeçalho
    cupomFormatado += linha() + "\n";
    cupomFormatado += centro(dadosLoja.nomeEmpresa.toUpperCase()) + "\n";
    cupomFormatado += centro("CUPOM NÃO FISCAL") + "\n";
    cupomFormatado += linha() + "\n\n";

    // Informações
    cupomFormatado += `Data: ${new Date(cupom.dataCupom).toLocaleDateString("pt-BR")}\n`;
    cupomFormatado += `Hora: ${new Date(cupom.dataCupom).toLocaleTimeString("pt-BR")}\n`;
    cupomFormatado += `Cupom: ${cupom.numero.toString().padStart(6, "0")}\n`;
    cupomFormatado += linha() + "\n\n";

    // Itens
    cupomFormatado += "DESCRIÇÃO             QTD    V.UNT    V.TOT\n";
    cupomFormatado += "-".repeat(largura) + "\n";

    cupom.itens.forEach(item => {
      const desc = item.descricao.substring(0, 20).padEnd(20);
      const qtd = item.quantidade.toString().padStart(4);
      const unitario = `R$ ${item.valorUnitario.toFixed(2)}`.padStart(8);
      const total = `R$ ${item.valorTotal.toFixed(2)}`.padStart(8);
      cupomFormatado += `${desc}${qtd}${unitario}${total}\n`;
    });

    cupomFormatado += "\n" + linha() + "\n";

    // Totalizações
    cupomFormatado += `Subtotal:              R$ ${cupom.subtotal.toFixed(2)}\n`;
    if (cupom.desconto && cupom.desconto > 0) {
      cupomFormatado += `Desconto:              R$ ${cupom.desconto.toFixed(2)}\n`;
    }
    if (cupom.acrescimo && cupom.acrescimo > 0) {
      cupomFormatado += `Acréscimo:             R$ ${cupom.acrescimo.toFixed(2)}\n`;
    }

    cupomFormatado += linha() + "\n";
    cupomFormatado += `TOTAL:                 R$ ${cupom.total.toFixed(2)}\n`;
    cupomFormatado += linha() + "\n";

    // Forma de pagamento
    const formaLabels: Record<string, string> = {
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      pix: "PIX",
      boleto: "Boleto",
      cheque: "Cheque"
    };

    cupomFormatado += `Forma de Pagamento: ${formaLabels[cupom.formaPagamento]}\n`;
    cupomFormatado += "\n" + centro("OBRIGADO PELA COMPRA") + "\n";
    cupomFormatado += linha() + "\n";

    return cupomFormatado;
  }

  /**
   * Formata cupom em HTML para visualização/email
   */
  static formatarCupomHTML(cupom: CupomFiscal): string {
    return `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: monospace; padding: 20px; background: white; }
          .cupom { max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
          .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
          .titulo { font-size: 16px; margin: 10px 0; }
          .info { margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          td { padding: 8px 0; border-bottom: 1px solid #ccc; }
          .item-desc { text-align: left; }
          .item-valor { text-align: right; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="cupom">
          <div class="header">
            <div class="titulo">${dadosLoja.nomeEmpresa}</div>
            <div>CUPOM NÃO FISCAL</div>
          </div>

          <div class="info">
            <div>Data: ${new Date(cupom.dataCupom).toLocaleDateString("pt-BR")}</div>
            <div>Hora: ${new Date(cupom.dataCupom).toLocaleTimeString("pt-BR")}</div>
            <div>Cupom: ${cupom.numero.toString().padStart(6, "0")}</div>
          </div>

          <table>
            <tr style="font-weight: bold; border-bottom: 2px solid #000;">
              <td class="item-desc">Descrição</td>
              <td class="item-valor">Qtd</td>
              <td class="item-valor">Valor</td>
            </tr>
            ${cupom.itens.map(item => `
              <tr>
                <td class="item-desc">${item.descricao}</td>
                <td class="item-valor">${item.quantidade}</td>
                <td class="item-valor">R$ ${item.valorTotal.toFixed(2)}</td>
              </tr>
            `).join("")}
          </table>

          <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0;">
            <div>Subtotal: R$ ${cupom.subtotal.toFixed(2)}</div>
            ${cupom.desconto ? `<div>Desconto: R$ ${cupom.desconto.toFixed(2)}</div>` : ""}
            ${cupom.acrescimo ? `<div>Acréscimo: R$ ${cupom.acrescimo.toFixed(2)}</div>` : ""}
            <div class="total">TOTAL: R$ ${cupom.total.toFixed(2)}</div>
          </div>

          <div class="footer">
            Obrigado pela compra!
          </div>
        </div>
      </body>
    </html>
    `;
  }

  /**
   * Verifica se o cupom está pronto para ser enviado ao SEFAZ (validação estrutural)
   */
  static cupomFiscalEstaPreparadoParaSEFAZ(cupom: CupomFiscal): boolean {
    // Validações básicas de estrutura
    if (!cupom.itens || cupom.itens.length === 0) return false;
    if (!cupom.total || cupom.total <= 0) return false;
    if (!cupom.formaPagamento) return false;

    // Todos os itens devem ter os campos obrigatórios
    const itensValidos = cupom.itens.every(
      item => item.descricao && item.quantidade > 0 && item.valorUnitario > 0
    );

    return itensValidos;
  }
}

export default CupomFiscalService;
