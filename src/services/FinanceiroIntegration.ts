// src/services/FinanceiroIntegration.ts
// 🔥 REMOVIDO - ACOPLAMENTO ENTRE STORES CAUSAVA RACE CONDITIONS
// Agora a integração é feita via services (CompraService, VendaService)

/**
 * @deprecated Use CompraService.registrarCompraCompleta() para compras
 * @deprecated Use VendaService.registrarVendaCompleta() para vendas
 * 
 * Este arquivo foi desabilitado para resolver problemas de:
 * - Race conditions
 * - Acoplamento entre stores
 * - Sobrescrita de estado pelo Firebase
 */

export const iniciarFinanceiroIntegration = () => {
  console.warn("⚠️ FinanceiroIntegration desabilitado. Use services específicos.");
};