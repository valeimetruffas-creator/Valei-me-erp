export function requireTenant(req, res, next) {
  if (!req.authUser?.empresaId) {
    return res.status(403).json({ success: false, error: "Tenant inválido" });
  }

  return next();
}

export function assertSameTenant(empresaId, authUser) {
  return Boolean(authUser?.empresaId && empresaId && authUser.empresaId === empresaId);
}
