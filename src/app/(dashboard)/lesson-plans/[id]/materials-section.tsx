"use client";

import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Material } from "@/lib/ai/schemas";

const MATERIAL_TYPE_OPTIONS = [
  { value: "worksheet", label: "Arbeitsblatt" },
  { value: "physical", label: "Physisch" },
  { value: "digital", label: "Digital" },
  { value: "textbook", label: "Schulbuch" },
  { value: "other", label: "Sonstiges" },
] as const;

type MaterialItemState =
  | { type: "view" }
  | {
      type: "edit";
      draft: Material;
      saving: boolean;
      error: string | null;
      showDeleteConfirm: boolean;
    };

type MaterialsSectionProps = {
  materials: Material[];
  onSave: (updated: Material[]) => Promise<void>;
};

export function MaterialsSection({
  materials: initialMaterials,
  onSave,
}: MaterialsSectionProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [itemStates, setItemStates] = useState<Record<number, MaterialItemState>>({});

  // Sync with prop when parent updates
  const [lastInitial, setLastInitial] = useState(initialMaterials);
  if (initialMaterials !== lastInitial) {
    const hasAnyEditing = Object.values(itemStates).some(
      (s) => s.type === "edit"
    );
    if (!hasAnyEditing) {
      setLastInitial(initialMaterials);
      setMaterials(initialMaterials);
      setItemStates({});
    }
  }

  function getState(index: number): MaterialItemState {
    return itemStates[index] ?? { type: "view" };
  }

  function setItemState(index: number, state: MaterialItemState) {
    setItemStates((prev) => ({ ...prev, [index]: state }));
  }

  function handleEdit(index: number) {
    setItemStates((prev) => {
      const closed: Record<number, MaterialItemState> = {};
      for (const key of Object.keys(prev)) {
        closed[Number(key)] = { type: "view" };
      }
      closed[index] = {
        type: "edit",
        draft: { ...materials[index] },
        saving: false,
        error: null,
        showDeleteConfirm: false,
      };
      return closed;
    });
  }

  function handleCancel(index: number) {
    // Remove if it was a blank newly-added item
    if (!materials[index]?.title) {
      const next = materials.filter((_, i) => i !== index);
      setMaterials(next);
      setItemStates((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setItemState(index, { type: "view" });
    }
  }

  async function handleSave(index: number) {
    const state = getState(index);
    if (state.type !== "edit") return;
    if (!state.draft.title.trim()) {
      setItemState(index, { ...state, error: "Titel darf nicht leer sein." });
      return;
    }
    setItemState(index, { ...state, saving: true, error: null });
    const next = materials.map((m, i) =>
      i === index ? { ...state.draft, title: state.draft.title.trim() } : m
    );
    try {
      await onSave(next);
      setMaterials(next);
      setItemState(index, { type: "view" });
    } catch {
      setItemState(index, { ...state, saving: false, error: "Speichern fehlgeschlagen." });
    }
  }

  async function handleDelete(index: number) {
    const next = materials.filter((_, i) => i !== index);
    try {
      await onSave(next);
      setMaterials(next);
      setItemStates((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
    } catch {
      // Silently leave
    }
  }

  function handleAddMaterial() {
    const blank: Material = { title: "", type: "other", description: "" };
    const next = [...materials, blank];
    setMaterials(next);
    const newIndex = next.length - 1;
    setItemStates((prev) => {
      const closed: Record<number, MaterialItemState> = {};
      for (const key of Object.keys(prev)) {
        closed[Number(key)] = { type: "view" };
      }
      closed[newIndex] = {
        type: "edit",
        draft: { ...blank },
        saving: false,
        error: null,
        showDeleteConfirm: false,
      };
      return closed;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" />
          Materialien
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {materials.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Noch keine Materialien.
            </li>
          )}

          {materials.map((mat, i) => {
            const state = getState(i);

            if (state.type === "edit") {
              return (
                <li key={i} className="rounded-lg border p-3 flex flex-col gap-3">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Titel
                    </label>
                    <Input
                      value={state.draft.title}
                      onChange={(e) =>
                        setItemState(i, {
                          ...state,
                          draft: { ...state.draft, title: e.target.value },
                          error: null,
                        })
                      }
                      placeholder="z.B. Arbeitsblatt Brüche"
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Typ
                    </label>
                    <Select
                      value={state.draft.type}
                      onValueChange={(v) =>
                        setItemState(i, {
                          ...state,
                          draft: { ...state.draft, type: v },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Beschreibung
                    </label>
                    <Textarea
                      rows={2}
                      value={state.draft.description}
                      onChange={(e) =>
                        setItemState(i, {
                          ...state,
                          draft: { ...state.draft, description: e.target.value },
                        })
                      }
                      placeholder="Kurze Beschreibung…"
                      className="text-sm resize-none"
                    />
                  </div>

                  {state.error && (
                    <p className="text-xs text-destructive">{state.error}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {state.showDeleteConfirm ? (
                        <>
                          <span className="text-xs text-muted-foreground">
                            Wirklich löschen?
                          </span>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleDelete(i)}
                          >
                            Ja, löschen
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              setItemState(i, {
                                ...state,
                                showDeleteConfirm: false,
                              })
                            }
                          >
                            Abbrechen
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setItemState(i, {
                              ...state,
                              showDeleteConfirm: true,
                            })
                          }
                        >
                          <Trash2 className="mr-1.5 size-3.5" />
                          Löschen
                        </Button>
                      )}
                    </div>
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
                  </div>
                </li>
              );
            }

            return (
              <li key={i} className="group flex items-start gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className="mt-0.5 shrink-0 text-xs"
                >
                  {mat.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{mat.title}</span>
                  {mat.description && (
                    <p className="text-muted-foreground">{mat.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleEdit(i)}
                  title="Bearbeiten"
                >
                  <Pencil className="size-3" />
                </Button>
              </li>
            );
          })}
        </ul>

        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-muted-foreground hover:text-foreground"
          onClick={handleAddMaterial}
        >
          <Plus className="mr-1.5 size-4" />
          Material hinzufügen
        </Button>
      </CardContent>
    </Card>
  );
}
