import { cookies } from "next/headers";
import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types/supabase";

export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies });

export const createRouteClient = () =>
  createRouteHandlerClient<Database>({ cookies });
