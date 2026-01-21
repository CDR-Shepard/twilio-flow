import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types/supabase";
import { getSupabaseEnv } from "./env";

export async function requireAdminSession() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createServerComponentClient<Database>(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey }
  );
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("email", session.user.email!)
    .single();

  if (!admin) {
    redirect("/login?error=not_admin");
  }

  return { supabase, session };
}
