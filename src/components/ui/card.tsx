import type { HTMLAttributes } from "react";

const baseClass = "rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${baseClass} ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 p-4 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-sm font-semibold leading-none tracking-tight ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 pt-0 ${className}`} {...props} />;
}
