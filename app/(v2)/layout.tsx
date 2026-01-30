import { Nav } from "../../components/nav";
import { requireAdminSession } from "../../lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 pb-12 pt-6 md:px-8">
        <div className="grid gap-8">{children}</div>
      </main>
    </div>
  );
}
