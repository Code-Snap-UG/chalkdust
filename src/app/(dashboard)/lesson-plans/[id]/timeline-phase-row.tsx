"use client";

import { useState } from "react";
import { GripVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveSnippetDialog } from "@/components/snippets/save-snippet-dialog";
import type { TimelinePhase } from "@/lib/ai/schemas";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const METHOD_OPTIONS = [
  "Unterrichtsgespräch",
  "Gruppenarbeit",
  "Einzelarbeit",
  "Partnerarbeit",
  "Lehrervortrag",
  "Sonstiges",
] as const;

const PHASE_SUGGESTIONS = ["Einstieg", "Erarbeitung", "Sicherung", "Abschluss"];

type TimelinePhaseRowProps = {
  id: string;
  phase: TimelinePhase;
  index: number;
  isEditing: boolean;
  lessonPlanId: string;
  onDraftDurationChange: (index: number, minutes: number) => void;
  onEdit: (index: number) => void;
  onCancel: (index: number) => void;
  onSave: (index: number, updated: TimelinePhase) => Promise<void>;
  onDelete: (index: number) => void;
};

export function TimelinePhaseRow({
  id,
  phase,
  index,
  isEditing,
  lessonPlanId,
  onDraftDurationChange,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: TimelinePhaseRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [draft, setDraft] = useState<TimelinePhase>(phase);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Keep draft in sync when phase prop changes (e.g. after external save)
  // but only when not currently editing
  const [lastPhase, setLastPhase] = useState(phase);
  if (!isEditing && phase !== lastPhase) {
    setLastPhase(phase);
    setDraft(phase);
  }

  function handleEditClick() {
    setDraft(phase);
    setSaveError(null);
    setShowDeleteConfirm(false);
    onEdit(index);
  }

  function handleCancel() {
    setDraft(phase);
    setSaveError(null);
    setShowDeleteConfirm(false);
    onCancel(index);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(index, draft);
      setShowDeleteConfirm(false);
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDurationChange(value: string) {
    const minutes = Math.max(1, parseInt(value, 10) || 1);
    setDraft((d) => ({ ...d, durationMinutes: minutes }));
    onDraftDurationChange(index, minutes);
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border">
      {/* Header row — always visible */}
      <div className="flex items-center gap-2 p-3">
        <div
          className={`shrink-0 text-muted-foreground/40 ${
            isEditing
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing"
          }`}
          {...attributes}
          {...(isEditing ? {} : listeners)}
        >
          <GripVertical className="size-4" />
        </div>

        <span className="flex-1 font-medium text-sm">{phase.phase}</span>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs">
            {phase.method}
          </Badge>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {phase.durationMinutes} Min.
          </span>
          <SaveSnippetDialog phase={phase} lessonPlanId={lessonPlanId} />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleEditClick}
            title="Bearbeiten"
          >
            <Pencil className={`size-3.5 ${isEditing ? "text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Description — view mode only */}
      {!isEditing && phase.description && (
        <p className="px-3 pb-3 text-sm text-muted-foreground">
          {phase.description}
        </p>
      )}

      {/* Edit form — inline expand */}
      {isEditing && (
        <div className="border-t px-3 pb-3 pt-3 flex flex-col gap-3">
          {/* Row 1: Phase name + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Phase
              </label>
              <Input
                list={`phase-suggestions-${index}`}
                value={draft.phase}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phase: e.target.value }))
                }
                placeholder="z.B. Einstieg"
                className="h-8 text-sm"
              />
              <datalist id={`phase-suggestions-${index}`}>
                {PHASE_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Methode
              </label>
              <Select
                value={draft.method}
                onValueChange={(v) => setDraft((d) => ({ ...d, method: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Duration */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground shrink-0">
              Dauer
            </label>
            <Input
              type="number"
              min={1}
              max={180}
              value={draft.durationMinutes}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="h-8 w-20 text-sm"
            />
            <span className="text-sm text-muted-foreground">Min.</span>
          </div>

          {/* Row 3: Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Beschreibung
            </label>
            <Textarea
              rows={3}
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Was passiert in dieser Phase?"
              className="text-sm resize-none"
            />
          </div>

          {/* Error */}
          {saveError && (
            <p className="text-xs text-destructive">{saveError}</p>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between">
            {/* Delete */}
            <div className="flex items-center gap-2">
              {showDeleteConfirm ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    Wirklich löschen?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onDelete(index)}
                  >
                    Ja, löschen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Abbrechen
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-1.5 size-3.5" />
                  Löschen
                </Button>
              )}
            </div>

            {/* Cancel / Save */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-1.5 size-3 animate-spin" />}
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
