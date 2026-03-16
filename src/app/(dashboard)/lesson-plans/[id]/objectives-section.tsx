"use client";

import { useState } from "react";
import { Pencil, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Objective } from "@/lib/ai/schemas";

type ObjectivesSectionProps = {
  objectives: Objective[];
  onSave: (updated: Objective[]) => Promise<void>;
};

type ItemState =
  | { type: "view" }
  | { type: "edit"; draft: string; saving: boolean; error: string | null };

export function ObjectivesSection({
  objectives: initialObjectives,
  onSave,
}: ObjectivesSectionProps) {
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives);
  const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});

  // Sync with prop when parent updates (AI chat refresh)
  const [lastInitial, setLastInitial] = useState(initialObjectives);
  if (initialObjectives !== lastInitial) {
    const hasAnyEditing = Object.values(itemStates).some(
      (s) => s.type === "edit"
    );
    if (!hasAnyEditing) {
      setLastInitial(initialObjectives);
      setObjectives(initialObjectives);
      setItemStates({});
    }
  }

  function getState(index: number): ItemState {
    return itemStates[index] ?? { type: "view" };
  }

  function setItemState(index: number, state: ItemState) {
    setItemStates((prev) => ({ ...prev, [index]: state }));
  }

  function handleEdit(index: number) {
    setItemStates((prev) => {
      const next: Record<number, ItemState> = {};
      for (const key of Object.keys(prev)) {
        next[Number(key)] = { type: "view" };
      }
      next[index] = {
        type: "edit",
        draft: objectives[index]?.text ?? "",
        saving: false,
        error: null,
      };
      return next;
    });
  }

  function handleCancel(index: number) {
    setItemState(index, { type: "view" });
    if (!objectives[index]?.text) {
      const next = objectives.filter((_, i) => i !== index);
      setObjectives(next);
      setItemStates((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  async function handleSave(index: number) {
    const state = getState(index);
    if (state.type !== "edit") return;
    const trimmed = state.draft.trim();
    if (!trimmed) {
      setItemState(index, { ...state, error: "Lernziel darf nicht leer sein." });
      return;
    }
    setItemState(index, { ...state, saving: true, error: null });
    const next = objectives.map((o, i) =>
      i === index ? { ...o, text: trimmed } : o
    );
    try {
      await onSave(next);
      setObjectives(next);
      setItemState(index, { type: "view" });
    } catch {
      setItemState(index, {
        ...state,
        saving: false,
        error: "Speichern fehlgeschlagen.",
      });
    }
  }

  async function handleDelete(index: number) {
    const next = objectives.filter((_, i) => i !== index);
    try {
      await onSave(next);
      setObjectives(next);
      setItemStates((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
    } catch {
      // Silently leave as-is on error
    }
  }

  function handleAddObjective() {
    const next = [...objectives, { text: "" }];
    setObjectives(next);
    const newIndex = next.length - 1;
    setItemStates((prev) => {
      const closed: Record<number, ItemState> = {};
      for (const key of Object.keys(prev)) {
        closed[Number(key)] = { type: "view" };
      }
      closed[newIndex] = { type: "edit", draft: "", saving: false, error: null };
      return closed;
    });
  }

  return (
    <section className="border-t pt-5">
      <p className="mb-3 text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Lernziele
      </p>

      <ul className="flex flex-col gap-2">
        {objectives.length === 0 && (
          <li className="text-sm text-muted-foreground">
            Noch keine Lernziele.
          </li>
        )}

        {objectives.map((obj, i) => {
          const state = getState(i);
          if (state.type === "edit") {
            return (
              <li key={i} className="flex flex-col gap-2">
                <Textarea
                  rows={2}
                  value={state.draft}
                  onChange={(e) =>
                    setItemState(i, {
                      ...state,
                      draft: e.target.value,
                      error: null,
                    })
                  }
                  placeholder="Lernziel eingeben…"
                  className="resize-none text-sm"
                  autoFocus
                />
                {state.error && (
                  <p className="text-xs text-destructive">{state.error}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleCancel(i)}
                    disabled={state.saving}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSave(i)}
                    disabled={state.saving}
                  >
                    {state.saving && (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    )}
                    Speichern
                  </Button>
                </div>
              </li>
            );
          }

          return (
            <li key={i} className="group flex items-start gap-2 text-sm">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="flex-1">{obj.text}</span>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(i)}
                  title="Bearbeiten"
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(i)}
                  title="Löschen"
                >
                  <X className="size-3" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 text-muted-foreground hover:text-foreground"
        onClick={handleAddObjective}
      >
        <Plus className="mr-1.5 size-4" />
        Lernziel hinzufügen
      </Button>
    </section>
  );
}
