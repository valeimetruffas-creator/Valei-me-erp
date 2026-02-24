import type React from "react";

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 mt-6">
      {children}
    </div>
  );
}

