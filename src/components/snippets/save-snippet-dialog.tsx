"use client";

import { useState } from "react";
import { Bookmark, BookmarkPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TimelinePhase } from "@/lib/ai/schemas";

type Props = {
  phase: TimelinePhase;
  lessonPlanId: string;
};

export function SaveSnippetDialog({ phase, lessonPlanId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(phase.phase);
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset form when closing, but keep saved state on the trigger
      setTitle(phase.phase);
      setTagsInput("");
      setNotes("");
    }
    setOpen(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || phase.phase,
          phase: phase.phase,
          durationMinutes: phase.durationMinutes,
          description: phase.description,
          method: phase.method,
          tags,
          notes: notes.trim() || undefined,
          sourceLessonPlanId: lessonPlanId,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setOpen(false), 800);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        title="Als Snippet speichern"
      >
        {saved ? (
          <Bookmark className="size-3.5 fill-current" />
        ) : (
          <BookmarkPlus className="size-3.5" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Baustein speichern</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
            {/* Phase preview */}
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">{phase.phase}</p>
              <p className="mt-0.5 text-muted-foreground line-clamp-2">
                {phase.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {phase.durationMinutes} Min. &middot; {phase.method}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snippet-title">Titel</Label>
              <Input
                id="snippet-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Würfelspiel Einstieg"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snippet-tags">
                Tags{" "}
                <span className="font-normal text-muted-foreground">
                  (kommagetrennt)
                </span>
              </Label>
              <Input
                id="snippet-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="z.B. spiel, einstieg, 5. klasse"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snippet-notes">
                Notizen{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="snippet-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z.B. Funktioniert gut bei lebhaften Klassen"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={saving}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving || saved}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Speichern...
                  </>
                ) : saved ? (
                  <>
                    <Bookmark className="mr-2 size-4 fill-current" />
                    Gespeichert
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="mr-2 size-4" />
                    Speichern
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
