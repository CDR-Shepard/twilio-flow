"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { LayoutDashboard, Users, Phone, PhoneCall, LogOut, Settings } from "lucide-react";
import { Dock } from "./magic/dock";
import { cn } from "../lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "indigo" as const },
  { href: "/call-logs", label: "Activity", icon: PhoneCall, tone: "cyan" as const },
  { href: "/tracked-numbers", label: "Numbers", icon: Phone, tone: "emerald" as const },
  { href: "/agents", label: "Agents", icon: Users, tone: "amber" as const },
  { href: "/reports", label: "Reports", icon: LayoutDashboard, tone: "rose" as const },
  { href: "/settings", label: "Settings", icon: Settings, tone: "slate" as const }
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabaseClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const dockItems = [
    ...links.map((link) => ({
      ...link,
      active: pathname?.startsWith(link.href)
    })),
    { label: "Sign out", icon: LogOut, onClick: handleSignOut, tone: "rose" as const }
  ];

  return (
    <>
      <aside className="hidden min-h-screen w-[92px] flex-col items-center px-3 py-5 md:flex">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/30 ring-2 ring-white/30"
        >
          Flow Ops
        </Link>
        <Dock items={dockItems} orientation="vertical" />
      </aside>

      {/* Mobile bottom dock */}
      <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-xl justify-center md:hidden">
        <div className={cn("surface w-full max-w-xl px-2 py-1")}>
          <Dock items={dockItems.slice(0, 5)} orientation="horizontal" />
        </div>
      </div>
    </>
  );
}
