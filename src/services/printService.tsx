import React from "react";
import ReactDOMServer from "react-dom/server";
import Cupom from "../components/Cupom";


// Função para gerar HTML do cupom
export function gerarHTMLDoCupom(
  products: { name: string; quantity: number; price: number }[],
  total: number,
  discount: number,
  addition: number
): string {
  return ReactDOMServer.renderToString(
    <Cupom
      products={products}
      total={total}
      discount={discount}
      addition={addition}
    />
  );
}
type Produto = {
  nome: string;
  quantidade: number;
};


// Função principal para imprimir
export function printSale(
  products: { name: string; quantity: number; price: number }[],
  total: number,
  discount: number,
  addition: number
) {
  const html = gerarHTMLDoCupom(products, total, discount, addition);

  const printWindow = document.createElement("iframe");
  printWindow.style.position = "fixed";
  printWindow.style.right = "0";
  printWindow.style.bottom = "0";
  printWindow.style.width = "0";
  printWindow.style.height = "0";
  printWindow.style.border = "0";
  document.body.appendChild(printWindow);

  const doc = printWindow.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <html>
      <head>
        <style>
          * {
            font-size: 10px;
            font-family: 'Courier New', monospace;
          }
          .cupom {
            width: 250px;
            padding: 5px;
          }
          .linha {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .center {
            text-align: center;
          }
          .right {
            text-align: right;
          }
          .bold {
            font-weight: bold;
          }
        </style>
      </head>
      <body onload="window.focus(); window.print(); window.close();">
        <div class="cupom">${html}</div>
      </body>
    </html>
  `);
  doc.close();
}
