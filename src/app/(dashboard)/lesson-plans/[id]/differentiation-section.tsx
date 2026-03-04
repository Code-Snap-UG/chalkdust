"use client";

import { useState } from "react";
import { Pencil, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Differentiation } from "@/lib/ai/schemas";

type DifferentiationSectionProps = {
  differentiation: Differentiation;
  onSave: (updated: Differentiation) => Promise<void>;
};

export function DifferentiationSection({
  differentiation: initialDifferentiation,
  onSave,
}: DifferentiationSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Differentiation>(initialDifferentiation);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync with prop when parent updates (AI chat)
  const [last, setLast] = useState(initialDifferentiation);
  if (initialDifferentiation !== last && !isEditing) {
    setLast(initialDifferentiation);
    setDraft(initialDifferentiation);
  }

  function handleEdit() {
    setDraft(initialDifferentiation);
    setSaveError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setDraft(initialDifferentiation);
    setSaveError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(draft);
      setIsEditing(false);
    } catch {
      setSaveError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Differenzierung
          </CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Schwächere Schüler
              </label>
              <Textarea
                rows={3}
                value={draft.weaker}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, weaker: e.target.value }))
                }
                placeholder="Anpassungen für Schüler mit mehr Unterstützungsbedarf…"
                className="text-sm resize-none"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Stärkere Schüler
              </label>
              <Textarea
                rows={3}
                value={draft.stronger}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, stronger: e.target.value }))
                }
                placeholder="Erweiterungen für Schüler mit mehr Herausforderungsbedarf…"
                className="text-sm resize-none"
              />
            </div>

            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
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
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium">Schwächere Schüler</p>
              <p className="text-sm text-muted-foreground">
                {initialDifferentiation.weaker || (
                  <span className="italic">Keine Angabe</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Stärkere Schüler</p>
              <p className="text-sm text-muted-foreground">
                {initialDifferentiation.stronger || (
                  <span className="italic">Keine Angabe</span>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
