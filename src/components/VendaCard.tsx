import React from "react";
import { theme } from "../styles/theme";

interface VendaCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function VendaCard({ title, children, className = "" }: VendaCardProps) {
  return (
    <section className={`shadow rounded-lg p-6 ${className}`} style={{ backgroundColor: theme.colors.primaryDark, color: theme.colors.background }}>
      <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.primaryLight }}>{title}</h2>
      {children}
    </section>
  );
}