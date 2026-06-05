import { type ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  variant?: "default" | "interactive";
  onClick?: () => void;
  className?: string;
}

export function Card({
  children,
  variant = "default",
  onClick,
  className = "",
}: CardProps) {
  const variantClasses = {
    default: "bg-white rounded-lg p-4",
    interactive:
      "bg-gray-100 hover:bg-gray-200 rounded-lg p-4 cursor-pointer transition-colors",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
