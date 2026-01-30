"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  LayoutDashboard,
  Users,
  Phone,
  PhoneCall,
  LogOut,
  Settings,
  Activity,
  Menu
} from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/console", label: "Overview", icon: LayoutDashboard },
  { href: "/live", label: "Live feed", icon: Activity },
  { href: "/call-logs", label: "Logs", icon: PhoneCall },
  { href: "/tracked-numbers", label: "Numbers", icon: Phone },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const renderLinks = (variant: "desktop" | "mobile") =>
    navItems.map((item) => {
      const active = pathname?.startsWith(item.href);
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
            variant === "desktop" && "hover:bg-slate-100",
            variant === "mobile" && "hover:bg-slate-100",
            active ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-700"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      );
    });

  return (
    <>
      {/* Sidebar for desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white/95 px-4 py-6 lg:flex">
        <Link href="/console" className="flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Flow</p>
            <p className="text-lg font-bold text-slate-900">Admin</p>
          </div>
        </Link>

        <div className="mt-6 space-y-1">{renderLinks("desktop")}</div>

        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed top-0 z-30 w-full border-b border-slate-200 bg-white/95 px-4 py-2 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/console" className="text-base font-bold text-slate-900">
            Flow Admin
          </Link>
          <div className="ml-auto">
            <button
              onClick={handleSignOut}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {mobileOpen ? <div className="mt-3 grid gap-1">{renderLinks("mobile")}</div> : null}
      </header>
    </>
  );
}
