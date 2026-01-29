import { Nav } from "../../components/nav";
import { requireAdminSession } from "../../lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-900">
      <Nav />
      <main className="flex">
        <div className="container-wide py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr]">{children}</div>
        </div>
      </main>
    </div>
  );
}
