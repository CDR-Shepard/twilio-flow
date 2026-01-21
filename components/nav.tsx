"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "./ui/button";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
  { href: "/tracked-numbers", label: "Tracked Numbers" },
  { href: "/call-logs", label: "Call Logs" }
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
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
            CR
          </div>
          <nav className="flex items-center gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100",
                  pathname?.startsWith(link.href) && "bg-slate-100 text-slate-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Button variant="ghost" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
