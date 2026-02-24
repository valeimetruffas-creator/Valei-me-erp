import React from "react";
import { VendaCard } from "./VendaCard";

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: string;
  date: string;
  products: SaleItem[];
  discount: number;
  addition: number;
  total: number;
}

interface HistoricoVendasProps {
  sales: Sale[];
  totalGeral: number;
}

// Função para extrair data no formato DD/MM/AAAA
const formatDateOnly = (datetime: string) => {
  const [date] = datetime.split(" ");
  return date.replaceAll("-", "/").split("/").reverse().join("/");
};

export function HistoricoVendas({ sales, totalGeral }: HistoricoVendasProps) {
  // Agrupar vendas por data (dia)
  const vendasPorDia: Record<string, Sale[]> = {};
  sales.forEach((sale) => {
    const dia = formatDateOnly(sale.date);
    if (!vendasPorDia[dia]) vendasPorDia[dia] = [];
    vendasPorDia[dia].push(sale);
  });

  // Ordenar datas da mais recente para mais antiga
  const datasOrdenadas = Object.keys(vendasPorDia).sort(
    (a, b) =>
      new Date(b.split("/").reverse().join("-")).getTime() -
      new Date(a.split("/").reverse().join("-")).getTime()
  );

  return (
    <VendaCard title="Histórico de Vendas" className="mt-12">
      <p className="mb-4 text-gray-700">
        Total geral vendido: <strong>R$ {totalGeral.toFixed(2)}</strong>
      </p>

      {sales.length === 0 && <p className="text-gray-500">Nenhuma venda realizada ainda.</p>}

      {datasOrdenadas.map((data) => {
        const vendas = vendasPorDia[data];

        // Produto mais vendido do dia
        const produtoContagem: Record<string, number> = {};
        vendas.forEach((venda) => {
          venda.products.forEach((prod) => {
            produtoContagem[prod.name] = (produtoContagem[prod.name] || 0) + prod.quantity;
          });
        });
        const maisVendido = Object.entries(produtoContagem).sort((a, b) => b[1] - a[1])[0];

        const totalDoDia = vendas.reduce((sum, v) => sum + v.total, 0);

        return (
          <div key={data} className="mb-6">
            <h3 className="text-lg font-bold text-pink-600 border-b pb-1 mb-2">
              📅 {data} — Total do dia: R$ {totalDoDia.toFixed(2)}
            </h3>
            {maisVendido && (
              <p className="text-sm text-gray-600 mb-2">
                Produto mais vendido: <strong>{maisVendido[0]}</strong> ({maisVendido[1]}x)
              </p>
            )}

            {vendas.map((sale) => (
              <div key={sale.id} className="bg-rose-50 border border-rose-200 rounded p-4 mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>🕒 {sale.date.split(" ")[1]}</span>
                  <span>Total: R$ {sale.total.toFixed(2)}</span>
                </div>
                {sale.products.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{p.name} x{p.quantity}</span>
                    <span>R$ {(p.price * p.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </VendaCard>
  );
}
