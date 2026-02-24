import { produtoRepository } from "../../repositories/produtoRepository.js";
import { ifoodAuthService } from "./ifoodAuthService.js";
import { ifoodMerchantService } from "./ifoodMerchantService.js";
import { ifoodConfigRepository } from "./ifoodConfigRepository.js";
import { mapProductToIfood } from "./ifoodMapper.js";
import { ifoodRequest } from "./ifoodHttpClient.js";
import { logger } from "../../config/logger.js";

class IfoodCatalogService {
  async syncCatalog(empresaId) {
    const token = await ifoodAuthService.getAccessToken(empresaId);
    const merchantId = await ifoodMerchantService.ensureMerchantId(empresaId);
    const produtos = await produtoRepository.listByEmpresa(empresaId);

    const catalogItems = produtos.map(mapProductToIfood);

    const payload = {
      merchantId,
      items: catalogItems,
    };

    const response = await ifoodRequest({
      method: "POST",
      path: "/catalog/v2.0/import",
      token,
      body: payload,
    });

    await ifoodConfigRepository.updateLastSync(empresaId);

    logger.info("ifood_catalog_synced", {
      empresaId,
      merchantId,
      totalProdutos: produtos.length,
    });

    return {
      merchantId,
      totalProdutos: produtos.length,
      response,
    };
  }
}

export const ifoodCatalogService = new IfoodCatalogService();
