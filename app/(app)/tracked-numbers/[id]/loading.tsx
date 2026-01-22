import { Card } from "../../../../components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-80 rounded bg-slate-200" />
      <Card>
        <div className="h-64 rounded bg-slate-100" />
      </Card>
    </div>
  );
}
