import clsx from "clsx";

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  subtitle?: string;
};

export function Card({ title, children, className, actions, subtitle }: Props) {
  return (
    <div className={clsx("glass rounded-2xl border border-white/50", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-white/50 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
