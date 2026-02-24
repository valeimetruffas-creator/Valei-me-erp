import { getAdminAuth, getAdminDb } from "../firebaseAdmin.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ success: false, error: "Token ausente" });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const snap = await getAdminDb().collection("usuarios").doc(decoded.uid).get();

    if (!snap.exists) {
      return res.status(403).json({ success: false, error: "Usuário sem tenant associado" });
    }

    const perfil = snap.data() || {};
    req.authUser = {
      uid: decoded.uid,
      email: decoded.email || null,
      role: String(perfil.role || "funcionario").toLowerCase(),
      empresaId: perfil.empresaId || null,
    };

    if (!req.authUser.empresaId) {
      return res.status(403).json({ success: false, error: "empresaId não encontrado para usuário" });
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token inválido",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.authUser || !["admin", "administrador"].includes(req.authUser.role)) {
    return res.status(403).json({ success: false, error: "Apenas admin pode executar esta ação" });
  }

  return next();
}
