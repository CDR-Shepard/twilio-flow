import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "muted";
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-slate-100 text-slate-700",
        tone === "success" && "bg-accent-50 text-accent-700",
        tone === "warning" && "bg-amber-50 text-amber-800",
        tone === "muted" && "bg-white/50 text-slate-500 border border-slate-100",
        className
      )}
    >
      {children}
    </span>
  );
}
