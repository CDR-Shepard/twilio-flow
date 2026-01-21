"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";

type Props = {
  children: React.ReactNode;
  session: Session | null;
};

export function SupabaseProvider({ children, session }: Props) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={session}>
      {children}
    </SessionContextProvider>
  );
}
