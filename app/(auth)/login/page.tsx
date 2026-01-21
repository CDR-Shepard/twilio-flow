import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../lib/types/supabase";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.user?.email) {
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", session.user.email)
      .single();
    if (admin) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Admin login</h1>
        <p className="mb-6 text-sm text-slate-600">
          Use your Supabase account email/password. Only allowlisted admins can sign in.
        </p>
        {searchParams?.error === "not_admin" && (
          <div className="mb-4 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Your account is not on the admin allowlist.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
