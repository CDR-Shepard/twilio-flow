import Link from "next/link";
import clsx from "clsx";
import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { createTrackedNumber, deleteTrackedNumber, toggleTrackedNumber } from "./actions";

export default async function TrackedNumbersPage() {
  const { supabase } = await requireAdminSession();
  const { data: numbersData } = await supabase
    .from("tracked_numbers")
    .select("*")
    .order("created_at", { ascending: false });
  type TrackedNumberRow = import("../../../lib/types/supabase").Database["public"]["Tables"]["tracked_numbers"]["Row"];
  const numbers: TrackedNumberRow[] = numbersData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Numbers</p>
        <h1 className="text-3xl font-bold text-slate-900">Tracked numbers</h1>
        <p className="text-sm text-slate-600">Control which Twilio lines are live and where they route.</p>
      </div>

      <Card title="Add tracked number" subtitle="We’ll normalize to E.164">
        <form action={createTrackedNumber} className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Friendly name</label>
            <Input name="friendly_name" placeholder="Main line" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Twilio phone (E.164)</label>
            <Input name="twilio_phone_number" placeholder="+15558675309" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">
              Save
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Numbers" subtitle="Click any row to edit routing">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Number</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {numbers?.map((num) => (
                <tr key={num.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-3">
                    <Link href={`/tracked-numbers/${num.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {num.friendly_name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{num.twilio_phone_number}</td>
                  <td className="px-3 py-3">
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                        num.active ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {num.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-3 space-x-2 text-right">
                    <form action={toggleTrackedNumber.bind(null, num.id, !num.active)} className="inline">
                      <Button type="submit" variant="secondary" size="sm">
                        {num.active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                    <form action={deleteTrackedNumber.bind(null, num.id)} className="inline">
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!numbers || numbers.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-slate-500">
                    No tracked numbers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
export const dynamic = "force-dynamic";
