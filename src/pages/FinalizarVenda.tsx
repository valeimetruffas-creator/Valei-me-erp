import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { descontarEstoque } from "../services/stockService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { printSale } from "../services/printService";
import ReactDOMServer from "react-dom/server";
import Cupom from "../components/Cupom";

type Produto = {
  nome: string;
  quantidade: number;
};

const FinalizarVenda = () => {
  const { cart, clearCart } = useCart();
  const [discount, setDiscount] = useState(0);
  const [addition, setAddition] = useState(0);
  const navigate = useNavigate();

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalFinal = total - discount + addition;

  const finalizarVenda = async () => {
    try {
      await descontarEstoque(
        cart.map((item) => ({
          nome: item.name,
          quantidade: item.quantity,
        }))
      );

      await printSale(cart, totalFinal, discount, addition); // cart ainda serve aqui!
      toast.success("Venda finalizada com sucesso!");
      clearCart();
      navigate("/venda");
    } catch (err) {
      toast.error("Erro ao finalizar venda");
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Finalizar Venda</h2>

      <div className="space-y-2">
        <div>
          <label className="block font-medium">Desconto:</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="border p-1 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Acréscimo:</label>
          <input
            type="number"
            value={addition}
            onChange={(e) => setAddition(Number(e.target.value))}
            className="border p-1 rounded w-full"
          />
        </div>

        <div className="font-bold">
          Total Final: R$ {totalFinal.toFixed(2)}
        </div>

        <button
          onClick={finalizarVenda}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
        >
          Finalizar e Imprimir Cupom
        </button>
      </div>
    </div>
  );
};

export default FinalizarVenda;

export async function gerarHTMLDoCupom(
  products: Produto[],
  total: number,
  discount: number = 0,
  addition: number = 0
): Promise<string> {
  // ⚠️ Conversão aqui para o formato que o Cupom espera
  const produtosConvertidos = products.map((p) => ({
    name: p.nome,
    quantity: p.quantidade,
    price: 0, // ou atribua o valor correto se tiver disponível
  }));

  const html = ReactDOMServer.renderToString(
    <Cupom
      products={produtosConvertidos}
      total={total}
      discount={discount}
      addition={addition}
    />
  );

  const styledHtml = `
    <html>
      <head>
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            width: 260px;
            padding: 10px;
          }
          .flex {
            display: flex;
            justify-content: space-between;
          }
          .text-center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          hr {
            border-top: 1 dashed #000;
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
  return styledHtml;
}
