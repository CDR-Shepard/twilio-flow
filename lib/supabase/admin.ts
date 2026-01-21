import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "../env";

export function getSupabaseAdmin() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
