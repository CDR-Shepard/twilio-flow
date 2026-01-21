import clsx from "clsx";

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
};

export function Card({ title, children, className, actions }: Props) {
  return (
    <div className={clsx("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
