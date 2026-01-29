import { redirect } from "next/navigation";

export default function Home() {
  redirect("/console");
}
export const dynamic = "force-dynamic";
