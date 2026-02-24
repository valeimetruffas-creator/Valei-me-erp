import { X } from "lucide-react";
import React from "react";

interface ProdutoInputProps {
  index: number;
  name: string;
  quantity: number;
  price: number;
  onRemove: (index: number) => void;
}

export function ProdutoInput({ index, name, quantity, price, onRemove }: ProdutoInputProps) {
  return (
    <div className="grid grid-cols-12 gap-2 bg-white rounded shadow p-3 mb-2">
      <div className="col-span-5 truncate" title={name}>{name}</div>
      <div className="col-span-2 text-center">x{quantity}</div>
      <div className="col-span-3 text-right font-medium">R$ {(price * quantity).toFixed(2)}</div>
      <button
        className="col-span-2 flex justify-end text-red-500 hover:text-red-700"
        onClick={() => onRemove(index)}>
        <X size={18} />
      </button>
    </div>
  );
}
