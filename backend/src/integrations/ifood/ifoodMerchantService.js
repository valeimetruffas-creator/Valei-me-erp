import { ifoodAuthService } from "./ifoodAuthService.js";
import { ifoodConfigRepository } from "./ifoodConfigRepository.js";
import { ifoodRequest } from "./ifoodHttpClient.js";

class IfoodMerchantService {
  async listMerchants(empresaId) {
    const token = await ifoodAuthService.getAccessToken(empresaId);
    const response = await ifoodRequest({
      method: "GET",
      path: "/merchants",
      token,
    });

    const merchants = Array.isArray(response) ? response : response?.merchants || [];

    if (merchants.length) {
      for (const merchant of merchants) {
        if (merchant?.id) {
          await ifoodConfigRepository.updateMerchant(empresaId, merchant.id);
        }
      }
    }

    return merchants;
  }

  async ensureMerchantId(empresaId) {
    const config = await ifoodConfigRepository.getByEmpresaId(empresaId);
    if (config?.merchantId) {
      return config.merchantId;
    }

    const merchants = await this.listMerchants(empresaId);
    if (!merchants.length) {
      throw new Error("Nenhum merchant iFood encontrado para a empresa");
    }

    const merchantId = merchants[0].id;
    await ifoodConfigRepository.updateMerchant(empresaId, merchantId);
    return merchantId;
  }
}

export const ifoodMerchantService = new IfoodMerchantService();
