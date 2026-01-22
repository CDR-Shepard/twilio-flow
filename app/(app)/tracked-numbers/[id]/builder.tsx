"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useTransition } from "react";
import { Button } from "../../../../components/ui/button";

export type Agent = {
  id: string;
  full_name: string;
  phone_number: string;
};

export function CallFlowBuilder({
  trackedNumberId,
  initialAvailable,
  initialSelected,
  onSave
}: {
  trackedNumberId: string;
  initialAvailable: Agent[];
  initialSelected: Agent[];
  onSave: (agentIds: string[]) => Promise<void>;
}) {
  const [available, setAvailable] = useState<Agent[]>(initialAvailable);
  const [selected, setSelected] = useState<Agent[]>(initialSelected);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const availableIds = available.map((a) => a.id);
  const selectedIds = selected.map((a) => a.id);

  const handleAddAll = () => {
    setSelected(selected.concat(available));
    setAvailable([]);
  };

  const handleClear = () => {
    setAvailable(available.concat(selected));
    setSelected([]);
  };

  function moveToSelected(id: string) {
    const agent = available.find((a) => a.id === id);
    if (!agent) return;
    setAvailable((prev) => prev.filter((a) => a.id !== id));
    setSelected((prev) => [...prev, agent]);
  }

  function moveToAvailable(id: string) {
    const agent = selected.find((a) => a.id === id);
    if (!agent) return;
    setSelected((prev) => prev.filter((a) => a.id !== id));
    setAvailable((prev) => [...prev, agent]);
  }

  function handleDragStart(event: any) {
    setActiveId(event.active?.id ?? null);
  }

  function handleDragEnd(event: any) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (selectedIds.includes(activeId) && selectedIds.includes(overId)) {
      const oldIndex = selectedIds.indexOf(activeId);
      const newIndex = selectedIds.indexOf(overId);
      setSelected((items) => arrayMove(items, oldIndex, newIndex));
      return;
    }

    if (availableIds.includes(activeId) && (overId === "selected" || selectedIds.includes(overId))) {
      const agent = available.find((a) => a.id === activeId);
      if (!agent) return;
      const insertIndex = selectedIds.includes(overId) ? selectedIds.indexOf(overId) : selected.length;
      setAvailable((prev) => prev.filter((a) => a.id !== activeId));
      setSelected((prev) => {
        const copy = [...prev];
        copy.splice(insertIndex, 0, agent);
        return copy;
      });
      return;
    }

    if (selectedIds.includes(activeId) && (overId === "available" || availableIds.includes(overId))) {
      moveToAvailable(activeId);
    }
  }

  const handleSave = () =>
    startTransition(async () => {
      await onSave(selected.map((a) => a.id));
    });

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-6 md:grid-cols-2">
        <Column title="Available agents" hint="Drag into the ringing group">
          <Droppable id="available">
            <SortableContext items={availableIds} strategy={verticalListSortingStrategy}>
              <List items={available} emptyLabel="No available agents" />
            </SortableContext>
          </Droppable>
        </Column>

        <Column
          title="Ringing group"
          hint="Top to bottom order; all ring simultaneously"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleAddAll} disabled={available.length === 0}>
                  Add all
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear} disabled={selected.length === 0}>
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                  {selected.length} agent{selected.length === 1 ? "" : "s"} in group
                </p>
                <Button onClick={handleSave} loading={saving} variant="accent">
                  Save order
                </Button>
              </div>
            </div>
          }
        >
          <Droppable id="selected">
            <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
              <List items={selected} emptyLabel="Drag agents here" />
            </SortableContext>
          </Droppable>
        </Column>
      </div>

      <DragOverlay>
        {activeId ? (
          <DragCard agent={[...available, ...selected].find((a) => a.id === activeId) || null} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  title,
  children,
  hint,
  footer
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      <div className="min-h-[260px] px-4 py-3">{children}</div>
      {footer && <div className="border-t border-slate-200 px-4 py-3">{footer}</div>}
    </div>
  );
}

function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[220px] rounded-lg border border-dashed ${
        isOver ? "border-accent-400 bg-accent-50" : "border-slate-200 bg-white/70"
      } transition-colors`}
    >
      {children}
    </div>
  );
}

function List({ items, emptyLabel }: { items: Agent[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <div className="p-3 text-center text-sm text-slate-500">{emptyLabel}</div>;
  }

  return (
    <div className="divide-y divide-slate-200">
      {items.map((item) => (
        <SortableItem key={item.id} id={item.id} item={item} />
      ))}
    </div>
  );
}

function SortableItem({ id, item }: { id: string; item: Agent }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center justify-between bg-white px-3 py-3 shadow-sm hover:shadow-md rounded-md"
    >
      <div>
        <div className="text-sm font-medium text-slate-900">{item.full_name}</div>
        <div className="text-xs text-slate-500">{item.phone_number}</div>
      </div>
      <span className="text-xs text-slate-400">⇅</span>
    </div>
  );
}

function DragCard({ agent }: { agent: Agent | null }) {
  if (!agent) return null;
  return (
    <div className="rounded-md bg-white px-3 py-3 shadow-xl ring-1 ring-slate-200">
      <div className="text-sm font-semibold text-slate-900">{agent.full_name}</div>
      <div className="text-xs text-slate-500">{agent.phone_number}</div>
    </div>
  );
}
