import "./globals.css";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { SupabaseProvider } from "../components/supabase-provider";
import { getSupabaseEnv } from "../lib/env";
import type { Metadata } from "next";
import type { Database } from "../lib/types/supabase";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Call Routing Admin",
  description: "Internal call routing console"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createServerComponentClient<Database>(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey }
  );
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider session={session}>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
