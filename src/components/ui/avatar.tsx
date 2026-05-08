import type { HTMLAttributes, ImgHTMLAttributes } from "react";

export function Avatar({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    />
  );
}

export function AvatarImage({ className = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={`h-full w-full object-cover ${className}`} {...props} />;
}

export function AvatarFallback({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-700 ${className}`}
      {...props}
    />
  );
}
