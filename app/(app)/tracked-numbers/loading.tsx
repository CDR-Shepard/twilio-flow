import { Card } from "../../../components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-slate-200" />
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
        </div>
      </Card>
      <Card>
        <div className="h-64 rounded bg-slate-100" />
      </Card>
    </div>
  );
}
