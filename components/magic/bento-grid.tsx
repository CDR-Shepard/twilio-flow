import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

type BentoProps = {
  className?: string;
  children: React.ReactNode;
};

type BentoCardProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  subtle?: boolean;
};

export function BentoGrid({ className, children }: BentoProps) {
  return (
    <div className={cn("grid auto-rows-[minmax(140px,_1fr)] gap-4 md:grid-cols-6", className)}>
      {children}
    </div>
  );
}

export function BentoCard({ title, description, icon, className, children, actions, subtle }: BentoCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-5 shadow-[0_15px_60px_rgba(15,23,42,0.12)] ring-1 ring-white/50 backdrop-blur-2xl",
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-white/80 before:via-white/60 before:to-white/30",
        subtle
          ? "after:absolute after:inset-x-[-40%] after:-z-10 after:h-[140%] after:rotate-12 after:bg-gradient-to-r after:from-indigo-500/12 after:via-cyan-400/12 after:to-emerald-400/12 after:blur-3xl"
          : "after:absolute after:inset-x-[-30%] after:-z-10 after:h-[140%] after:-rotate-6 after:bg-gradient-to-r after:from-indigo-500/18 after:via-sky-400/18 after:to-emerald-400/18 after:blur-2xl",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700/80">Pulse</p>
          <div className="flex items-center gap-2">
            {icon ? <span className="text-slate-700">{icon}</span> : null}
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          </div>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </motion.div>
  );
}
