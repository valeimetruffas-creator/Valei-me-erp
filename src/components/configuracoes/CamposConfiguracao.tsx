import React from "react";
import { theme } from "../../styles/theme";

interface CampoProps {
  label: string;
  children: React.ReactNode;
}

export function CampoConfiguracao({ label, children }: CampoProps) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>
        {label}
      </span>
      {children}
    </label>
  );
}

interface InputTextoProps {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "url" | "password";
  placeholder?: string;
}

export function InputTextoConfiguracao({ value, onChange, type = "text", placeholder }: InputTextoProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 rounded-lg border"
      style={{ borderColor: theme.colors.border, color: theme.colors.primary }}
    />
  );
}

interface InputNumeroProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}

export function InputNumeroConfiguracao({ value, onChange, min = 0, step = 1 }: InputNumeroProps) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full p-3 rounded-lg border"
      style={{ borderColor: theme.colors.border, color: theme.colors.primary }}
    />
  );
}

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextareaConfiguracao({ value, onChange, rows = 3, placeholder }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full p-3 rounded-lg border"
      style={{ borderColor: theme.colors.border, color: theme.colors.primary }}
    />
  );
}

interface SeletorProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
}

export function SelectConfiguracao<T extends string>({ value, onChange, options }: SeletorProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full p-3 rounded-lg border"
      style={{ borderColor: theme.colors.border, color: theme.colors.primary }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelAtivo?: string;
  labelInativo?: string;
}

export function ToggleConfiguracao({
  checked,
  onChange,
  labelAtivo = "Ativo",
  labelInativo = "Inativo",
}: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="px-4 py-2 rounded-lg font-semibold"
      style={{
        backgroundColor: checked ? theme.colors.success : theme.colors.border,
        color: "white",
      }}
    >
      {checked ? labelAtivo : labelInativo}
    </button>
  );
}
