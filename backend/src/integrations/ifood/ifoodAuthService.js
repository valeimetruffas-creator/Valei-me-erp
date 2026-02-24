import { ifoodConfigRepository } from "./ifoodConfigRepository.js";
import { ifoodRequest } from "./ifoodHttpClient.js";
import { logger } from "../../config/logger.js";

const tokenCache = new Map();

function isExpired(expiresAtIso) {
  if (!expiresAtIso) return true;
  const expiresAt = new Date(expiresAtIso).getTime();
  return Number.isNaN(expiresAt) || expiresAt <= Date.now() + 60_000;
}

function computeExpiration(expiresInSeconds) {
  const seconds = Number(expiresInSeconds || 3600);
  return new Date(Date.now() + seconds * 1000).toISOString();
}

class IfoodAuthService {
  async connect(empresaId, clientId, clientSecret) {
    await ifoodConfigRepository.upsertCredentials(empresaId, {
      clientId,
      clientSecret,
      ativo: true,
    });

    const accessToken = await this.getAccessToken(empresaId, { forceRefresh: true });
    return { accessToken, conectado: true };
  }

  async getAccessToken(empresaId, options = {}) {
    const cached = tokenCache.get(empresaId);
    if (!options.forceRefresh && cached && !isExpired(cached.tokenExpiration)) {
      return cached.accessToken;
    }

    const config = await ifoodConfigRepository.getByEmpresaId(empresaId);
    if (!config?.clientId || !config?.clientSecret) {
      throw new Error("Credenciais iFood não configuradas para esta empresa");
    }

    if (!options.forceRefresh && config.accessToken && !isExpired(config.tokenExpiration)) {
      tokenCache.set(empresaId, {
        accessToken: config.accessToken,
        tokenExpiration: config.tokenExpiration,
      });
      return config.accessToken;
    }

    const form = new URLSearchParams({
      grantType: "client_credentials",
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });

    const tokenResponse = await ifoodRequest({
      method: "POST",
      path: "/authentication/v1/oauth/token",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const accessToken = tokenResponse.accessToken || tokenResponse.access_token;
    const tokenExpiration = computeExpiration(tokenResponse.expiresIn || tokenResponse.expires_in);

    if (!accessToken) {
      throw new Error("Resposta OAuth iFood inválida: accessToken ausente");
    }

    await ifoodConfigRepository.upsertToken(empresaId, accessToken, tokenExpiration);
    tokenCache.set(empresaId, { accessToken, tokenExpiration });

    logger.info("ifood_token_refreshed", { empresaId, tokenExpiration });
    return accessToken;
  }

  async disconnect(empresaId) {
    tokenCache.delete(empresaId);
    await ifoodConfigRepository.disconnect(empresaId);
  }
}

export const ifoodAuthService = new IfoodAuthService();
