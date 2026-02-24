export class IfoodService {
  async exportarCardapio(empresaId) {
    void empresaId;
    return {
      integrado: false,
      mensagem: "Integração iFood ainda não habilitada. Estrutura pronta para ativação futura.",
    };
  }

  async mapearProdutos(empresaId) {
    void empresaId;
    return {
      integrado: false,
      mensagem: "Mapeamento de produtos iFood pendente de credenciais oficiais.",
    };
  }

  async sincronizarPedidos(empresaId) {
    void empresaId;
    return {
      integrado: false,
      mensagem: "Sincronização iFood ainda não habilitada.",
    };
  }
}

export const ifoodService = new IfoodService();
