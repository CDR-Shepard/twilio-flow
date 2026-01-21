"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({ className, children, variant = "primary", loading, ...rest }: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" && "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        rest.disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}
