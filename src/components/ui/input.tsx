import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={
        "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...props}
    />
  );
}
