import { getAdminDb } from "../firebaseAdmin.js";

class TenantService {
  async getEmpresaBySlug(slug) {
    const snap = await getAdminDb().collection("empresas").where("slug", "==", slug).limit(1).get();
    if (snap.empty) {
      return null;
    }

    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
}

export const tenantService = new TenantService();
