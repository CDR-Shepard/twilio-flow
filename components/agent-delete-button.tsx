"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

type Props = { id: string };

export function AgentDeleteButton({ id }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    startTransition(async () => {
      await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
      router.refresh();
    });
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleDelete} loading={pending}>
      Delete
    </Button>
  );
}
