"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  GripVertical,
  Check,
  Pencil,
  X,
} from "lucide-react";

type CurriculumTopic = {
  id: string;
  title: string;
  description: string | null;
  competencyArea: string | null;
};

type MilestoneData = {
  title: string;
  description: string;
  learningGoals: { text: string }[];
  estimatedLessons: number;
};

export function NewSeriesForm({
  classGroupId,
  className: classDisplayName,
  subject,
  grade,
  curriculumTopics,
}: {
  classGroupId: string;
  className: string;
  subject: string;
  grade: string;
  curriculumTopics: CurriculumTopic[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedLessons, setEstimatedLessons] = useState("8");
  const [estimatedWeeks, setEstimatedWeeks] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<MilestoneData | null>(null);

  function toggleTopic(topicId: string) {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }

  async function generateMilestones() {
    setGenerating(true);
    try {
      const res = await fetch("/api/series/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGroupId,
          title,
          description,
          estimatedLessons: parseInt(estimatedLessons) || 8,
          curriculumTopicIds: selectedTopicIds,
          additionalNotes: additionalNotes || undefined,
        }),
      });
      if (!res.ok) {
        alert("Fehler bei der Generierung.");
        return;
      }
      const data = await res.json();
      setMilestones(data.milestones);
    } catch {
      alert("Fehler bei der Generierung.");
    } finally {
      setGenerating(false);
    }
  }

  function addEmptyMilestone() {
    setMilestones((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        learningGoals: [],
        estimatedLessons: 1,
      },
    ]);
    setEditingIdx(milestones.length);
    setEditDraft({
      title: "",
      description: "",
      learningGoals: [],
      estimatedLessons: 1,
    });
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditDraft({ ...milestones[idx] });
  }

  function cancelEdit() {
    if (editingIdx !== null && milestones[editingIdx]?.title === "") {
      setMilestones((prev) => prev.filter((_, i) => i !== editingIdx));
    }
    setEditingIdx(null);
    setEditDraft(null);
  }

  function saveEdit() {
    if (editingIdx === null || !editDraft) return;
    setMilestones((prev) =>
      prev.map((m, i) => (i === editingIdx ? editDraft : m))
    );
    setEditingIdx(null);
    setEditDraft(null);
  }

  function removeMilestone(idx: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditDraft(null);
    }
  }

  async function saveSeries() {
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${classGroupId}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          estimatedLessons: parseInt(estimatedLessons) || 8,
          estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks) : undefined,
          milestones: milestones.filter((m) => m.title),
          curriculumTopicIds: selectedTopicIds.length
            ? selectedTopicIds
            : undefined,
        }),
      });
      if (!res.ok) {
        alert("Fehler beim Speichern.");
        return;
      }
      const data = await res.json();
      router.push(`/classes/${classGroupId}/series/${data.id}`);
    } catch {
      alert("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  const canGenerate = title.trim() && description.trim();
  const canSave = title.trim() && parseInt(estimatedLessons) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/classes/${classGroupId}/series`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Unterrichtsreihen
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Neue Unterrichtsreihe
        </h1>
        <p className="text-muted-foreground">
          {classDisplayName} &middot; {subject} &middot; Klasse {grade}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reihendetails</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="title" className="text-xs">
                  Titel *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Podiumsdiskussion"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="description" className="text-xs">
                  Ziel / Beschreibung *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="z.B. SuS können eine strukturierte Podiumsdiskussion führen"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="lessons" className="text-xs">
                    Geschätzte Stunden *
                  </Label>
                  <Input
                    id="lessons"
                    type="number"
                    value={estimatedLessons}
                    onChange={(e) => setEstimatedLessons(e.target.value)}
                    min={1}
                    max={100}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="weeks" className="text-xs">
                    Geschätzte Wochen
                  </Label>
                  <Input
                    id="weeks"
                    type="number"
                    value={estimatedWeeks}
                    onChange={(e) => setEstimatedWeeks(e.target.value)}
                    min={1}
                    max={52}
                  />
                </div>
              </div>

              {curriculumTopics.length > 0 && (
                <div className="grid gap-1.5">
                  <Label className="text-xs">
                    Verknüpfte Curriculums-Themen
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {curriculumTopics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTopic(t.id)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                          selectedTopicIds.includes(t.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="notes" className="text-xs">
                  Zusätzliche Hinweise
                </Label>
                <Input
                  id="notes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="z.B. Klasse hat wenig Erfahrung mit freiem Sprechen"
                />
              </div>

              <Button
                onClick={generateMilestones}
                disabled={generating || !canGenerate}
                className="mt-2"
              >
                {generating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                Meilensteine generieren
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Milestones */}
        <div className="flex flex-col gap-4">
          {milestones.length === 0 && !generating && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="mx-auto h-16 w-px bg-border" />
                <div className="size-4 rounded-full border-2 border-border" />
                <div className="mx-auto h-4 w-px bg-border" />
                <div className="size-4 rounded-full border-2 border-border" />
                <div className="mx-auto h-4 w-px bg-border" />
                <div className="size-4 rounded-full border-2 border-border" />
              </div>
              <p className="text-sm text-muted-foreground">
                Noch keine Meilensteine &mdash; erstelle sie manuell oder lass
                dir Vorschläge generieren.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addEmptyMilestone}>
                  <Plus className="mr-1.5 size-3.5" />
                  Manuell erstellen
                </Button>
                <Button
                  size="sm"
                  onClick={generateMilestones}
                  disabled={!canGenerate || generating}
                >
                  <Sparkles className="mr-1.5 size-3.5" />
                  Mit KI generieren
                </Button>
              </div>
            </div>
          )}

          {generating && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border bg-muted/20 p-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                KI erstellt Meilensteine...
              </p>
            </div>
          )}

          {milestones.length > 0 && !generating && (
            <>
              <div className="flex flex-col gap-2">
                {milestones.map((m, idx) => (
                  <Card
                    key={idx}
                    className="relative"
                  >
                    <CardContent className="py-3">
                      {editingIdx === idx && editDraft ? (
                        <div className="flex flex-col gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`m-title-${idx}`}>Meilensteintitel</Label>
                            <Input
                              id={`m-title-${idx}`}
                              value={editDraft.title}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  title: e.target.value,
                                })
                              }
                              placeholder="z.B. Einführung in die Grammatik"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`m-desc-${idx}`}>
                              Beschreibung{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </Label>
                            <Textarea
                              id={`m-desc-${idx}`}
                              value={editDraft.description}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Kurze Beschreibung des Meilensteins…"
                              rows={2}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`m-lessons-${idx}`}>
                              Geschätzte Stunden
                            </Label>
                            <Input
                              id={`m-lessons-${idx}`}
                              type="number"
                              value={editDraft.estimatedLessons}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  estimatedLessons:
                                    parseInt(e.target.value) || 1,
                                })
                              }
                              min={1}
                              className="w-24"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" onClick={saveEdit}>
                              <Check className="mr-1 size-3" />
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              <X className="mr-1 size-3" />
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs font-medium text-muted-foreground">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold line-clamp-1">
                                {m.title || "Ohne Titel"}
                              </p>
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {m.estimatedLessons}{" "}
                                {m.estimatedLessons === 1
                                  ? "Stunde"
                                  : "Stunden"}
                              </Badge>
                            </div>
                            {m.description && (
                              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                                {m.description}
                              </p>
                            )}
                            {m.learningGoals.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {m.learningGoals.map((g, gi) => (
                                  <span
                                    key={gi}
                                    className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                                  >
                                    {g.text}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              onClick={() => startEdit(idx)}
                              className="rounded p-1 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={() => removeMilestone(idx)}
                              className="rounded p-1 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addEmptyMilestone}>
                <Plus className="mr-1.5 size-3.5" />
                Meilenstein hinzufügen
              </Button>

              <Button
                onClick={saveSeries}
                disabled={saving || !canSave}
                size="lg"
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Check className="mr-2 size-4" />
                )}
                Reihe speichern
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
