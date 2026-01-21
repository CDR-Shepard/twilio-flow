import Link from "next/link";
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
      <h1 className="text-2xl font-semibold text-slate-900">Tracked numbers</h1>

      <Card title="Add tracked number">
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

      <Card title="Numbers">
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
            <tbody>
              {numbers?.map((num) => (
                <tr key={num.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">
                    <Link href={`/tracked-numbers/${num.id}`} className="font-medium text-brand-700">
                      {num.friendly_name}
                    </Link>
                  </td>
                  <td className="px-2 py-2">{num.twilio_phone_number}</td>
                  <td className="px-2 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {num.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-2 py-2 space-x-2 text-right">
                    <form action={toggleTrackedNumber.bind(null, num.id, !num.active)} className="inline">
                      <Button type="submit" variant="secondary">
                        {num.active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                    <form action={deleteTrackedNumber.bind(null, num.id)} className="inline">
                      <Button type="submit" variant="ghost">
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
