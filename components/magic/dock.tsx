"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { cn } from "../../lib/utils";

type DockItem = {
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void | Promise<void>;
  active?: boolean;
  tone?: "indigo" | "cyan" | "emerald" | "amber" | "rose" | "slate";
  badge?: string;
};

type Props = {
  items: DockItem[];
  orientation?: "vertical" | "horizontal";
};

const toneClasses: Record<NonNullable<DockItem["tone"]>, string> = {
  indigo: "from-indigo-500/80 via-sky-400/70 to-cyan-300/70",
  cyan: "from-cyan-500/80 via-sky-400/70 to-emerald-300/70",
  emerald: "from-emerald-500/80 via-teal-400/70 to-lime-300/70",
  amber: "from-amber-500/80 via-orange-400/70 to-yellow-300/70",
  rose: "from-rose-500/80 via-pink-400/70 to-fuchsia-300/70",
  slate: "from-slate-600/80 via-slate-500/70 to-slate-300/70"
};

export function Dock({ items, orientation = "vertical" }: Props) {
  const layout = orientation === "horizontal" ? "flex-row" : "flex-col";
  const size = orientation === "horizontal" ? "h-16 px-3 py-2" : "w-16 px-2 py-3";
  const radius = orientation === "horizontal" ? "rounded-3xl" : "rounded-2xl";

  const ordered = useMemo(
    () =>
      items.map((item, idx) => ({
        ...item,
        // spread tones for a soft gradient variety if not set
        tone: item.tone ?? (["indigo", "cyan", "emerald", "amber", "rose"][idx % 5] as DockItem["tone"])
      })),
    [items]
  );

  return (
    <div
      className={cn(
        "relative isolate shadow-2xl ring-1 ring-white/60 backdrop-blur-3xl bg-white/65",
        "before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:bg-white/60 before:backdrop-blur-2xl",
        radius,
        layout,
        size,
        "gap-2"
      )}
    >
      {ordered.map((item) => {
        const Icon = item.icon;
        const content = (
          <motion.div
            whileHover={{ scale: 1.12, y: orientation === "horizontal" ? -4 : -2 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "group relative flex items-center justify-center overflow-visible rounded-2xl p-2 transition-all",
              item.active
                ? "shadow-lg shadow-indigo-200/60"
                : "hover:shadow-md hover:shadow-slate-400/25",
              orientation === "vertical" ? "w-12 h-12" : "w-12 h-12"
            )}
          >
            <div
              className={cn(
                "absolute inset-[-18%] opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-70",
                `bg-gradient-to-br ${toneClasses[item.tone ?? "indigo"]}`
              )}
            />
            <div
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-slate-700 transition-colors",
                item.active ? "ring-2 ring-indigo-200 text-slate-900" : "group-hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.badge ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow-sm">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 translate-y-[70%] rounded-full bg-slate-900/90 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg shadow-slate-900/30 transition-all duration-150",
                "group-hover:translate-y-[95%] group-hover:opacity-100",
                orientation === "vertical" ? "bottom-[-6px]" : "top-full mt-2"
              )}
            >
              {item.label}
            </span>
          </motion.div>
        );

        if (item.href) {
          return (
            <Link key={item.label} href={item.href} className="relative">
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="relative"
            aria-label={item.label}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
