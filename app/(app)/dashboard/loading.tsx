import { Card } from "../../../components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="h-10 w-24 rounded bg-slate-200" />
          </Card>
        ))}
      </div>
      <Card>
        <div className="h-64 rounded bg-slate-100" />
      </Card>
    </div>
  );
}
