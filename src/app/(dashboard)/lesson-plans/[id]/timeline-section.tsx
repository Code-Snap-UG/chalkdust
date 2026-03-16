"use client";

import { useState } from "react";
import { Library, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelinePhaseRow } from "./timeline-phase-row";
import { SnippetDrawer } from "./snippet-drawer";
import type { TimelinePhase } from "@/lib/ai/schemas";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

type TimelineSectionProps = {
  phases: TimelinePhase[];
  lessonDurationMinutes: number;
  lessonPlanId: string;
  onSave: (updatedPhases: TimelinePhase[]) => Promise<void>;
};

function DurationIndicator({
  total,
  target,
}: {
  total: number;
  target: number;
}) {
  if (total === target) {
    return (
      <span className="tabular-nums text-xs font-medium text-muted-foreground">
        {total}/{target}&thinsp;Min.
      </span>
    );
  }
  if (total < target) {
    return (
      <span className="tabular-nums text-xs font-medium text-primary">
        ⚠&thinsp;{total}/{target}&thinsp;Min.
      </span>
    );
  }
  return (
    <span className="tabular-nums text-xs font-medium text-destructive">
      ⚠&thinsp;{total}/{target}&thinsp;Min.
    </span>
  );
}

export function TimelineSection({
  phases: initialPhases,
  lessonDurationMinutes,
  lessonPlanId,
  onSave,
}: TimelineSectionProps) {
  const [phases, setPhases] = useState<TimelinePhase[]>(initialPhases);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftDurations, setDraftDurations] = useState<Record<number, number>>(
    {}
  );
  const [isSnippetDrawerOpen, setIsSnippetDrawerOpen] = useState(false);

  // Keep phases in sync with prop when parent updates (AI chat, etc.)
  const [lastInitial, setLastInitial] = useState(initialPhases);
  if (initialPhases !== lastInitial && editingIndex === null) {
    setLastInitial(initialPhases);
    setPhases(initialPhases);
    setDraftDurations({});
  }

  const totalMinutes = phases.reduce((sum, p, i) => {
    return sum + (draftDurations[i] ?? p.durationMinutes);
  }, 0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = phases.findIndex((_, i) => `phase-${i}` === active.id);
    const newIndex = phases.findIndex((_, i) => `phase-${i}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(phases, oldIndex, newIndex);
    setPhases(reordered);
    onSave(reordered);
  }

  function handleEdit(index: number) {
    setEditingIndex(index);
    setDraftDurations((d) => {
      const next = { ...d };
      delete next[index];
      return next;
    });
  }

  function handleCancel(index: number) {
    setEditingIndex(null);
    setDraftDurations((d) => {
      const next = { ...d };
      delete next[index];
      return next;
    });
  }

  async function handleSave(index: number, updated: TimelinePhase) {
    const next = phases.map((p, i) => (i === index ? updated : p));
    await onSave(next);
    setPhases(next);
    setEditingIndex(null);
    setDraftDurations((d) => {
      const copy = { ...d };
      delete copy[index];
      return copy;
    });
  }

  async function handleDelete(index: number) {
    const next = phases.filter((_, i) => i !== index);
    await onSave(next);
    setPhases(next);
    setEditingIndex(null);
  }

  function handleAddPhase() {
    const blank: TimelinePhase = {
      phase: "Neue Phase",
      durationMinutes: 5,
      description: "",
      method: "Unterrichtsgespräch",
    };
    const next = [...phases, blank];
    setPhases(next);
    setEditingIndex(next.length - 1);
  }

  async function handleAddFromSnippet(phase: TimelinePhase) {
    const next = [...phases, phase];
    setPhases(next);
    setEditingIndex(next.length - 1);
    await onSave(next);
  }

  function handleDraftDurationChange(index: number, minutes: number) {
    setDraftDurations((d) => ({ ...d, [index]: minutes }));
  }

  const phaseIds = phases.map((_, i) => `phase-${i}`);

  return (
    <>
      <section className="border-t pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Stundenablauf
          </p>
          <div className="flex items-center gap-2">
            <DurationIndicator
              total={totalMinutes}
              target={lessonDurationMinutes}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsSnippetDrawerOpen(true)}
            >
              <Library className="size-3.5" />
              Snippets
            </Button>
          </div>
        </div>

        {phases.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Phasen — füge deine erste hinzu.
          </p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={phaseIds}
            strategy={verticalListSortingStrategy}
          >
          {phases.map((phase, i) => (
            <TimelinePhaseRow
              key={phaseIds[i]}
              id={phaseIds[i]}
              phase={phase}
              index={i}
              isEditing={editingIndex === i}
              lessonPlanId={lessonPlanId}
              onDraftDurationChange={handleDraftDurationChange}
              onEdit={handleEdit}
              onCancel={handleCancel}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
          </SortableContext>
        </DndContext>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-muted-foreground hover:text-foreground"
          onClick={handleAddPhase}
        >
          <Plus className="mr-1.5 size-4" />
          Phase hinzufügen
        </Button>
      </section>

      <SnippetDrawer
        open={isSnippetDrawerOpen}
        onOpenChange={setIsSnippetDrawerOpen}
        onInsert={handleAddFromSnippet}
      />
    </>
  );
}
