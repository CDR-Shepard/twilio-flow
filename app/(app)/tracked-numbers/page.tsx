import Link from "next/link";
import clsx from "clsx";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { requireAdminSession } from "../../../lib/auth";
import { createTrackedNumber, deleteTrackedNumber, toggleTrackedNumber } from "./actions";

export default async function TrackedNumbersPage() {
  const { supabase } = await requireAdminSession();
  const { data: numbersData } = await supabase
    .from("tracked_numbers")
    .select("*")
    .order("created_at", { ascending: false });
  type TrackedNumberRow = import("../../../lib/types/supabase").Database["public"]["Tables"]["tracked_numbers"]["Row"];
  const numbers: TrackedNumberRow[] = numbersData ?? [];

  const activeCount = numbers.filter((n) => n.active).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Numbers</p>
          <h1 className="text-3xl font-semibold text-slate-900">Tracked numbers</h1>
          <p className="text-sm text-slate-600">Control which Twilio lines are active and visible in routing.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Active: {activeCount} / {numbers.length}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Add number</p>
            <p className="text-sm text-slate-600">We normalize to E.164.</p>
          </div>
          <form action={createTrackedNumber} className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Friendly name</label>
              <Input name="friendly_name" placeholder="Main line" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Twilio phone number</label>
              <Input name="twilio_phone_number" placeholder="+15558675309" required />
            </div>
            <Button type="submit" className="w-full">
              Save number
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Numbers</p>
              <p className="text-sm font-semibold text-slate-800">Routes visible to callers</p>
            </div>
          </div>
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
                  <tr key={num.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <Link href={`/tracked-numbers/${num.id}`} className="font-semibold text-slate-900 hover:text-slate-700">
                        {num.friendly_name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{num.twilio_phone_number}</td>
                    <td className="px-3 py-3">
                      <span
                        className={clsx(
                          "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                          num.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
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
        </div>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
