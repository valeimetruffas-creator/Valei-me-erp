import { onCall, HttpsError } from "firebase-functions/v2/https";
import { admin, db } from "./firebase";

export const registrarVendaSegura = onCall(async (request) => {
  const { auth, data } = request;

  // 🔐 Verifica autenticação
  if (!auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const { produtos, cliente, desconto = 0 } = data as any;

  if (!produtos || !Array.isArray(produtos)) {
    throw new HttpsError("invalid-argument", "Lista de produtos inválida");
  }

  return await db.runTransaction(async (t) => {
    let total = 0;

    for (const item of produtos) {
      const ref = db.collection("produtos").doc(item.produtoId);
      const snap = await t.get(ref);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Produto não existe");
      }

      const produto = snap.data() as any;

      if (produto.estoqueUnidades < item.quantidade) {
        throw new HttpsError(
          "failed-precondition",
          `Estoque insuficiente para ${produto.nome}`
        );
      }

      total += produto.preco * item.quantidade;

      t.update(ref, {
        estoqueUnidades: produto.estoqueUnidades - item.quantidade,
      });
    }

    total -= desconto;

    const vendaRef = db.collection("vendas").doc();
    t.set(vendaRef, {
      produtos,
      cliente,
      total,
      desconto,
      userId: auth.uid,
      data: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { sucesso: true, total };
  });
});
