import { Nav } from "../../components/nav";
import { requireAdminSession } from "../../lib/auth";
import { BeamBackground } from "../../components/magic/beam-bg";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <BeamBackground />
      <div className="relative flex">
        <Nav />
        <main className="flex-1">
          <div className="container-wide py-10">
            <div className="grid gap-8 lg:grid-cols-[1fr]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
