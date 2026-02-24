import React from "react";
import ReactDOMServer from "react-dom/server";


// Interface do produto vendido
interface Produto {
  name: string;
  quantity: number;
  price: number;
}

// Gera o HTML do cupom como string (para impressão ou exportação)
export function gerarHTMLDoCupom(
  products: Produto[],
  total: number,
  discount: number = 0,
  addition: number = 0
): string {
  const html = ReactDOMServer.renderToString(
    <Cupom
      products={products}
      total={total}
      discount={discount}
      addition={addition}
    />
  );

  return `
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Cupom</title>
        <style>
          * {
            font-family: monospace;
            font-size: 12px;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            padding: 10px;
            width: 280px;
          }
          .text-center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .flex {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

// Função principal para imprimir o cupom
export function printSale(
  products: Produto[],
  total: number,
  discount: number = 0,
  addition: number = 0
) {
  const html = gerarHTMLDoCupom(products, total, discount, addition);

  const printWindow = window.open("", "_blank", "width=300,height=600");

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    // Fecha a janela depois de 3 segundos (tempo para impressoras térmicas)
    setTimeout(() => {
      printWindow.close();
    }, 3000);
  } else {
    console.error("Falha ao abrir a janela de impressão.");
  }
}
type CupomProps = {
  products: { name: string; quantity: number; price: number }[];
  total: number;
  discount?: number;
  addition?: number;
};

const Cupom: React.FC<CupomProps> = ({ products, total, discount = 0, addition = 0 }) => {
  return (
    <div>
      <div className="text-center bold">🍰 VALEI-ME DELIVERY</div>
      <hr />
      {products.map((p, i) => (
        <div key={i} className="flex">
          <span>{p.quantity}x {p.name}</span>
          <span>R$ {(p.price * p.quantity).toFixed(2)}</span>
        </div>
      ))}
      <hr />
      {discount > 0 && <div className="flex"><span>Desconto</span><span>-R$ {discount.toFixed(2)}</span></div>}
      {addition > 0 && <div className="flex"><span>Adicional</span><span>+R$ {addition.toFixed(2)}</span></div>}
      <div className="flex bold">
        <span>Total</span>
        <span>R$ {total.toFixed(2)}</span>
      </div>
      <hr />
      <div className="text-center">Obrigado pela preferência!</div>
    </div>
  );
};

export default Cupom;
