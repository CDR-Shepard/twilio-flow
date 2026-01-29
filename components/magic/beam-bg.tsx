import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

type Props = { className?: string };

export function BeamBackground({ className }: Props) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.12),transparent_35%)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-60" />
      <motion.div
        className="beam-sweep"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      />
    </div>
  );
}
