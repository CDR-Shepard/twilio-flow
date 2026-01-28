"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  Phone,
  PhoneCall,
  LogOut
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/tracked-numbers", label: "Tracked Numbers", icon: Phone },
  { href: "/call-logs", label: "Call Logs", icon: PhoneCall }
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
    <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-200 bg-white/85 backdrop-blur-xl shadow-sm md:flex">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-md shadow-slate-900/15">
          CF
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">Callflow</div>
          <div className="text-xs text-slate-500">Admin</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5 pt-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
