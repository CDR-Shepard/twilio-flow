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
    <>
      {/* Desktop rail with per-item expansion only */}
      <aside className="hidden min-h-screen w-[72px] flex-col md:flex">
        <nav className="flex-1 space-y-3 px-2 pt-4">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            const Icon = link.icon;
            return (
              <div key={link.href} className="relative flex justify-center">
                <Link
                  href={link.href}
                  className={clsx(
                    "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold glass-pill transition-all",
                    active
                      ? "ring-2 ring-brand-200 text-slate-900 shadow-lg shadow-brand-200/40"
                      : "text-slate-700 hover:ring-1 hover:ring-white/60 hover:shadow-md hover:shadow-slate-900/10"
                  )}
                  title={link.label}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-slate-700 group-hover:text-slate-900" />
                  <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-y-1/2 translate-x-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg shadow-slate-900/20 transition-opacity duration-150 group-hover:opacity-100">
                    {link.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="px-2 pb-5 pt-2 flex justify-center">
          <button
            onClick={handleSignOut}
            className="glass-pill flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:ring-1 hover:ring-white/60"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-3 z-30 mx-auto flex max-w-md items-center justify-around rounded-3xl bg-white/80 px-4 py-3 shadow-lg shadow-slate-900/15 ring-1 ring-white/60 backdrop-blur-2xl md:hidden">
        {links.slice(0, 4).map((link) => {
          const active = pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
                active ? "bg-brand-100 text-brand-700 shadow-sm" : "text-slate-700 hover:bg-slate-100"
              )}
              title={link.label}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-700 hover:bg-slate-100"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}
