import crypto from "node:crypto";
import { getAdminDb } from "../../firebaseAdmin.js";
import { env } from "../../config/env.js";

const collectionName = "integracoes_ifood";

function nowIso() {
  return new Date().toISOString();
}

function getKeyBuffer() {
  if (!env.ifoodEncryptionKey) {
    throw new Error("IFOOD_ENCRYPTION_KEY não configurada");
  }

  try {
    const maybeBase64 = Buffer.from(env.ifoodEncryptionKey, "base64");
    if (maybeBase64.length === 32) {
      return maybeBase64;
    }
  } catch {
    // noop
  }

  return crypto.createHash("sha256").update(env.ifoodEncryptionKey).digest();
}

function encrypt(plainText) {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decrypt(payload) {
  if (!payload) {
    return "";
  }

  const [ivB64, tagB64, dataB64] = String(payload).split(":");
  const key = getKeyBuffer();

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

class IfoodConfigRepository {
  collection() {
    return getAdminDb().collection(collectionName);
  }

  async getByEmpresaId(empresaId) {
    const snap = await this.collection().doc(empresaId).get();
    if (!snap.exists) {
      return null;
    }

    const data = snap.data() || {};
    return {
      empresaId,
      ...data,
      clientSecret: data.clientSecret ? decrypt(data.clientSecret) : (data.clientSecretEnc ? decrypt(data.clientSecretEnc) : ""),
      accessToken: data.accessToken ? decrypt(data.accessToken) : (data.accessTokenEnc ? decrypt(data.accessTokenEnc) : ""),
    };
  }

  async upsertCredentials(empresaId, payload) {
    const docRef = this.collection().doc(empresaId);
    const base = {
      empresaId,
      clientId: payload.clientId,
      ativo: Boolean(payload.ativo ?? true),
      atualizadoEm: nowIso(),
      ultimaSincronizacao: payload.ultimaSincronizacao ?? null,
    };

    if (payload.clientSecret) {
      const encryptedSecret = encrypt(payload.clientSecret);
      base.clientSecret = encryptedSecret;
      base.clientSecretEnc = encryptedSecret;
    }

    if (payload.merchantId) {
      base.merchantId = payload.merchantId;
    }

    await docRef.set(base, { merge: true });
  }

  async upsertToken(empresaId, accessToken, tokenExpiration) {
    const encryptedToken = encrypt(accessToken);
    await this.collection().doc(empresaId).set(
      {
        empresaId,
        accessToken: encryptedToken,
        accessTokenEnc: encryptedToken,
        tokenExpiration,
        atualizadoEm: nowIso(),
      },
      { merge: true },
    );
  }

  async updateStatus(empresaId, ativo) {
    await this.collection().doc(empresaId).set(
      {
        empresaId,
        ativo: Boolean(ativo),
        atualizadoEm: nowIso(),
      },
      { merge: true },
    );
  }

  async updateMerchant(empresaId, merchantId) {
    const current = await this.getByEmpresaId(empresaId);
    const merchantIdsAtual = Array.isArray(current?.merchantIds) ? current.merchantIds : [];
    const merchantIds = Array.from(new Set([...merchantIdsAtual, merchantId])).filter(Boolean);

    await this.collection().doc(empresaId).set(
      {
        empresaId,
        merchantId,
        merchantIds,
        atualizadoEm: nowIso(),
      },
      { merge: true },
    );
  }

  async getByMerchantId(merchantId) {
    const snap = await this.collection().where("merchantIds", "array-contains", merchantId).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      const data = doc.data() || {};
      return {
        empresaId: doc.id,
        ...data,
        clientSecret: data.clientSecret ? decrypt(data.clientSecret) : (data.clientSecretEnc ? decrypt(data.clientSecretEnc) : ""),
        accessToken: data.accessToken ? decrypt(data.accessToken) : (data.accessTokenEnc ? decrypt(data.accessTokenEnc) : ""),
      };
    }

    const fallback = await this.collection().where("merchantId", "==", merchantId).limit(1).get();
    if (fallback.empty) {
      return null;
    }

    const doc = fallback.docs[0];
    const data = doc.data() || {};
    return {
      empresaId: doc.id,
      ...data,
      clientSecret: data.clientSecret ? decrypt(data.clientSecret) : (data.clientSecretEnc ? decrypt(data.clientSecretEnc) : ""),
      accessToken: data.accessToken ? decrypt(data.accessToken) : (data.accessTokenEnc ? decrypt(data.accessTokenEnc) : ""),
    };
  }

  async updateLastSync(empresaId) {
    await this.collection().doc(empresaId).set(
      {
        empresaId,
        ultimaSincronizacao: nowIso(),
        atualizadoEm: nowIso(),
      },
      { merge: true },
    );
  }

  async listAtivos() {
    const snap = await this.collection().where("ativo", "==", true).get();
    return snap.docs.map((doc) => ({ empresaId: doc.id, ...doc.data() }));
  }

  async disconnect(empresaId) {
    await this.collection().doc(empresaId).set(
      {
        empresaId,
        ativo: false,
        clientSecret: "",
        accessTokenEnc: "",
        accessToken: "",
        tokenExpiration: null,
        atualizadoEm: nowIso(),
      },
      { merge: true },
    );
  }
}

export const ifoodConfigRepository = new IfoodConfigRepository();
