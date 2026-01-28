"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import { LayoutDashboard, Users, Phone, PhoneCall, LogOut, Settings } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/call-logs", label: "Activity", icon: PhoneCall },
  { href: "/tracked-numbers", label: "Numbers", icon: Phone },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/reports", label: "Reports", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabaseClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="group/nav hidden min-h-screen w-[64px] flex-col transition-[width] duration-200 hover:w-[240px] md:flex">
      <nav className="flex-1 space-y-2 px-2 pt-4">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all glass-pill",
                active
                  ? "ring-2 ring-brand-200 text-slate-900 shadow-lg shadow-brand-200/40"
                  : "text-slate-700 hover:ring-1 hover:ring-white/60 hover:shadow-md hover:shadow-slate-900/10"
              )}
              title={link.label}
            >
              <Icon className="h-5 w-5 flex-shrink-0 text-slate-700 group-hover:text-slate-900" />
              <span className="truncate opacity-0 transition-[opacity,margin] duration-150 group-hover/nav:opacity-100">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pb-5 pt-2">
        <button
          onClick={handleSignOut}
          className="glass-pill flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:ring-1 hover:ring-white/60"
        >
          <LogOut className="h-5 w-5" />
          <span className="opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
