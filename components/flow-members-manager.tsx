"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

type Agent = { id: string; full_name: string; phone_number: string; active: boolean };
type Member = { agent_id: string; delay_seconds: number; sort_order: number; active: boolean };
type MemberView = Member & { name: string; phone: string };

export function FlowMembersManager({
  flowType,
  initialMembers,
  agents,
  onSave
}: {
  flowType: "simultaneous" | "sequential" | "round_robin";
  initialMembers: MemberView[];
  agents: Agent[];
  onSave: (members: Member[]) => Promise<void>;
}) {
  const [members, setMembers] = useState<MemberView[]>(initialMembers);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [saving, startTransition] = useTransition();
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMounted = useRef(false);
  const [showSaving, setShowSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const available = useMemo(
    () => agents.filter((a) => !members.find((m) => m.agent_id === a.id)),
    [agents, members]
  );

  // auto-save with debounce
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(() => onSave(members));
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [members, onSave]);

  // Smooth saving indicator to avoid flicker on quick saves
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (saving) {
      timer = setTimeout(() => setShowSaving(true), 300);
    } else {
      setShowSaving(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [saving]);

  const handleDragStart = () => {};

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const ids = members.map((m) => m.agent_id);
    const activeIdx = ids.indexOf(String(active.id));
    const overIdx = ids.indexOf(String(over.id));
    if (activeIdx === -1 || overIdx === -1 || activeIdx === overIdx) return;
    const reordered = arrayMove(members, activeIdx, overIdx).map((m, idx) => ({ ...m, sort_order: idx }));
    setMembers(reordered);
  }

  function addAgents(agentIds: string[]) {
    if (!agentIds.length) return;
    const next: MemberView[] = [
      ...members,
      ...agentIds
        .filter((id) => !members.find((m) => m.agent_id === id))
        .map((id, idx) => ({
          agent_id: id,
          delay_seconds: flowType === "simultaneous" ? 0 : 0,
          sort_order: members.length + idx,
          active: true,
          name: agents.find((a) => a.id === id)?.full_name ?? "Agent",
          phone: agents.find((a) => a.id === id)?.phone_number ?? ""
        }))
    ];
    setMembers(next);
    setSelectedAgentIds([]);
  }

  function removeMember(agent_id: string) {
    setMembers((prev) => prev.filter((m) => m.agent_id !== agent_id));
  }

  function updateDelay(agent_id: string, value: number) {
    setMembers((prev) => prev.map((m) => (m.agent_id === agent_id ? { ...m, delay_seconds: value } : m)));
  }

  function toggleActive(agent_id: string) {
    setMembers((prev) => prev.map((m) => (m.agent_id === agent_id ? { ...m, active: !m.active } : m)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Available agents</p>
            <p className="text-sm text-slate-600">Drag or multi-select to add</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={selectedAgentIds.length === 0}
            onClick={() => addAgents(selectedAgentIds)}
          >
            Add selected ({selectedAgentIds.length})
          </Button>
        </div>
        <div className="space-y-2">
          {available.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">{a.full_name}</div>
                <div className="text-xs text-slate-500">{a.phone_number}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAgentIds.includes(a.id)}
                  onChange={(e) =>
                    setSelectedAgentIds((prev) =>
                      e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                    )
                  }
                />
                <Button size="sm" variant="ghost" onClick={() => addAgents([a.id])}>
                  Add
                </Button>
              </div>
            </div>
          ))}
          {available.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Everyone is already in this flow.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Flow members</p>
            <p className="text-sm text-slate-600">
              {flowType === "simultaneous" ? "Simultaneous waves by delay" : "Order defines ring priority"}
            </p>
          </div>
          <div className="text-xs text-slate-500">{showSaving ? "Saving…" : "Auto-saved"}</div>
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <SortableContext items={members.map((m) => m.agent_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {members.map((m, idx) => (
                <SortableRow
                  key={m.agent_id}
                  id={m.agent_id}
                  name={agents.find((a) => a.id === m.agent_id)?.full_name ?? "Unknown"}
                  phone={agents.find((a) => a.id === m.agent_id)?.phone_number ?? ""}
                  delay={m.delay_seconds}
                  order={idx + 1}
                  showOrder={flowType !== "simultaneous"}
                  active={m.active}
                  onDelayChange={(val) => updateDelay(m.agent_id, val)}
                  onRemove={() => removeMember(m.agent_id)}
                  onToggleActive={() => toggleActive(m.agent_id)}
                />
              ))}
              {members.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Drag agents here to build the flow.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableRow({
  id,
  name,
  phone,
  delay,
  order,
  showOrder,
  active,
  onDelayChange,
  onRemove,
  onToggleActive
}: {
  id: string;
  name: string;
  phone: string;
  delay: number;
  order: number;
  showOrder: boolean;
  active: boolean;
  onDelayChange: (v: number) => void;
  onRemove: () => void;
  onToggleActive: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm",
        isDragging && "ring-2 ring-accent-400"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg text-slate-400 cursor-grab">⇅</span>
        <div>
          <div className="text-sm font-semibold text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">{phone}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          Delay
          <Input
            type="number"
            min={0}
            max={60}
            className="w-20"
            value={delay}
            onChange={(e) => onDelayChange(Number(e.target.value) || 0)}
          />
          <span className="text-slate-500">s</span>
        </label>
        {showOrder && <span className="text-xs text-slate-500">Order #{order}</span>}
        <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={active} onChange={onToggleActive} />
          Active
        </label>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}
