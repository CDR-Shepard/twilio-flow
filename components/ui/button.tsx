"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  loading?: boolean;
  size?: "sm" | "md";
};

export function Button({
  className,
  children,
  variant = "primary",
  loading,
  size = "md",
  ...rest
}: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-1",
        size === "md" ? "px-3.5 py-2.5 text-sm" : "px-2.5 py-1.5 text-xs",
        variant === "primary" && "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:translate-y-[1px]",
        variant === "accent" && "bg-accent-500 text-white shadow-sm hover:bg-accent-600 active:translate-y-[1px]",
        variant === "secondary" &&
          "bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        rest.disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}
