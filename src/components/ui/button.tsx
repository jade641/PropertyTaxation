import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "secondary" | "ghost" | "outline";
type ButtonSize = "default" | "sm" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClass =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-6",
};

export function Button({
  variant = "default",
  size = "default",
  className = "",
  ...props
}: ButtonProps) {
  const classes = [baseClass, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
}
