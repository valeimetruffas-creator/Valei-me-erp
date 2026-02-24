interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <input
      placeholder="Buscar insumo..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-3 rounded-lg border outline-none"
    />
  );
}
