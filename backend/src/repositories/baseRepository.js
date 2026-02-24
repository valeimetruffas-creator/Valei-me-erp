import { randomUUID } from "node:crypto";
import { getAdminDb } from "../firebaseAdmin.js";

function nowIso() {
  return new Date().toISOString();
}

function buildDoc(collectionName, doc) {
  return {
    id: doc.id,
    ...doc.data(),
  };
}

export class BaseTenantRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  collection() {
    return getAdminDb().collection(this.collectionName);
  }

  async listByEmpresa(empresaId, options = {}) {
    let query = this.collection().where("empresaId", "==", empresaId);

    if (options.status) {
      query = query.where("status", "==", options.status);
    }

    if (typeof options.limit === "number") {
      query = query.limit(options.limit);
    }

    const snap = await query.get();
    return snap.docs.map((doc) => buildDoc(this.collectionName, doc));
  }

  async getById(id) {
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) {
      return null;
    }

    return buildDoc(this.collectionName, snap);
  }

  async create(empresaId, payload) {
    const id = payload.id || randomUUID();
    const data = {
      ...payload,
      id,
      empresaId,
      criadoEm: payload.criadoEm || nowIso(),
      atualizadoEm: nowIso(),
    };

    await this.collection().doc(id).set(data, { merge: true });
    return data;
  }

  async updateById(id, empresaId, payload) {
    const existente = await this.getById(id);
    if (!existente || existente.empresaId !== empresaId) {
      return null;
    }

    const next = {
      ...existente,
      ...payload,
      id,
      empresaId,
      atualizadoEm: nowIso(),
    };

    await this.collection().doc(id).set(next, { merge: true });
    return next;
  }
}
