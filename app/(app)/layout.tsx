import { Nav } from "../../components/nav";
import { requireAdminSession } from "../../lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="container-wide py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr]">{children}</div>
      </main>
    </div>
  );
}
