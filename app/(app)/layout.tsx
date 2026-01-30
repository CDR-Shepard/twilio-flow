import { Nav } from "../../components/nav";
import { requireAdminSession } from "../../lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />
      <main className="px-4 pb-12 pt-20 lg:pl-72 lg:pt-10">
        <div className="mx-auto max-w-7xl space-y-8">{children}</div>
      </main>
    </div>
  );
}
