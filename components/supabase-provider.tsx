"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseEnv } from "../lib/env";

type Props = {
  children: React.ReactNode;
  session: Session | null;
};

export function SupabaseProvider({ children, session }: Props) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey
    })
  );
  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={session}>
      {children}
    </SessionContextProvider>
  );
}
