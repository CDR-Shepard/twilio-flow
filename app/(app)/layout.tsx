import { Nav } from "../../components/nav";
import { requireAdminSession } from "../../lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
