import { Router } from "express";
import { z } from "zod";
import { getAdminDb } from "../firebaseAdmin.js";
import { requireAuth } from "../middlewares/tenantMiddleware.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

const upsertEmpresaSchema = z.object({
  nome: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  taxaEntrega: z.number().min(0).default(0),
  whatsapp: z.string().optional(),
  horarioFuncionamento: z.string().optional(),
});

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.authUser });
}));

router.get("/empresa", requireAuth, asyncHandler(async (req, res) => {
  const snap = await getAdminDb().collection("empresas").doc(req.authUser.empresaId).get();
  return res.json({ success: true, data: snap.exists ? snap.data() : null });
}));

router.put("/empresa", requireAuth, asyncHandler(async (req, res) => {
  const parsed = upsertEmpresaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Payload inválido", details: parsed.error.flatten() });
  }

  const empresaRef = getAdminDb().collection("empresas").doc(req.authUser.empresaId);
  await empresaRef.set(
    {
      ...parsed.data,
      atualizadoEm: new Date().toISOString(),
      empresaId: req.authUser.empresaId,
    },
    { merge: true },
  );

  return res.json({ success: true });
}));

export default router;
