"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type HomeworkSectionProps = {
  homework: string | null;
  onSave: (updated: string | null) => Promise<void>;
};

export function HomeworkSection({
  homework: initialHomework,
  onSave,
}: HomeworkSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialHomework ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync with prop when parent updates (AI chat)
  const [last, setLast] = useState(initialHomework);
  if (initialHomework !== last && !isEditing) {
    setLast(initialHomework);
    setDraft(initialHomework ?? "");
  }

  function handleEdit() {
    setDraft(initialHomework ?? "");
    setSaveError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setDraft(initialHomework ?? "");
    setSaveError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const value = draft.trim() || null;
      await onSave(value);
      setIsEditing(false);
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="border-t pt-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Hausaufgaben
        </p>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
            title="Bearbeiten"
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-3">
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Hausaufgaben eingeben… (leer lassen zum Entfernen)"
            className="resize-none text-sm"
            autoFocus
          />
          {saveError && (
            <p className="text-xs text-destructive">{saveError}</p>
          )}
          <div className="flex items-center justify-end gap-2">
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
              {isSaving && (
                <Loader2 className="mr-1.5 size-3 animate-spin" />
              )}
              Speichern
            </Button>
          </div>
        </div>
      ) : initialHomework ? (
        <p className="text-sm leading-relaxed">{initialHomework}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground/60">
          Noch keine Hausaufgaben geplant.
        </p>
      )}
    </section>
  );
}
