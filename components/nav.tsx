"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { LayoutDashboard, Users, Phone, PhoneCall, LogOut, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

const links = [
  { href: "/console", label: "Console", icon: LayoutDashboard },
  { href: "/live", label: "Live Feed", icon: PhoneCall },
  { href: "/tracked-numbers", label: "Numbers", icon: Phone },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/call-logs", label: "Legacy Logs", icon: LayoutDashboard },
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 md:px-8">
        <Link href="/console" className="text-sm font-semibold tracking-tight text-slate-900">
          Flow Ops
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
                {active ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-1 -bottom-1 h-0.5 rounded-full bg-slate-900"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
