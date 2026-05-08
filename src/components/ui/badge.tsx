import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "secondary" | "destructive";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const baseClass = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  secondary: "bg-slate-50 text-slate-600 border-slate-200",
  destructive: "bg-red-100 text-red-700 border-red-200",
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return <span className={`${baseClass} ${variantClasses[variant]} ${className}`} {...props} />;
}
