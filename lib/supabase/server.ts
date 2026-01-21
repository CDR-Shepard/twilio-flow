import { cookies } from "next/headers";
import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types/supabase";
import { getSupabaseEnv } from "../env";

const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

export const createServerClient = () =>
  createServerComponentClient<Database>(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey }
  );

export const createRouteClient = () =>
  createRouteHandlerClient<Database>(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey }
  );
