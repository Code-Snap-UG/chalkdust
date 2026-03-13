"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateCurriculumTopics } from "@/lib/actions/curriculum";
import {
  BookOpen,
  Check,
  GripVertical,
  Loader2,
  Pencil,
  PenLine,
  Trash2,
  X,
} from "lucide-react";

type Topic = {
  id: string;
  title: string;
  description: string | null;
  competencyArea: string | null;
  sortOrder: number;
};

type EditableTopic = {
  title: string;
  description: string;
  competencyArea: string;
};

type Props = {
  classGroupId: string;
  curriculum: {
    id: string;
    sourceFileName: string | null;
  } | null;
  topics: Topic[];
};

export function CurriculumClient({ classGroupId, curriculum, topics }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTopics, setEditTopics] = useState<EditableTopic[]>([]);
  const [isPending, startTransition] = useTransition();

  function enterEditMode() {
    setEditTopics(
      topics.length > 0
        ? topics.map((t) => ({
            title: t.title,
            description: t.description ?? "",
            competencyArea: t.competencyArea ?? "",
          }))
        : [{ title: "", description: "", competencyArea: "" }]
    );
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditTopics([]);
  }

  function updateTopic(index: number, field: keyof EditableTopic, value: string) {
    setEditTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  function removeTopic(index: number) {
    setEditTopics((prev) => prev.filter((_, i) => i !== index));
  }

  function addTopic() {
    setEditTopics((prev) => [
      ...prev,
      { title: "", description: "", competencyArea: "" },
    ]);
  }

  function moveTopic(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editTopics.length) return;
    setEditTopics((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  }

  function handleSave() {
    const validTopics = editTopics.filter((t) => t.title.trim().length > 0);
    startTransition(async () => {
      await updateCurriculumTopics(classGroupId, validTopics);
      setIsEditing(false);
    });
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Lehrplan bearbeiten</h1>
            <p className="text-sm text-muted-foreground">
              Themen umsortieren, ergänzen oder entfernen.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isPending}>
              <X className="mr-1.5 size-3.5" />
              Abbrechen
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 size-3.5" />
              )}
              Speichern
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {editTopics.map((topic, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border p-3"
            >
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => moveTopic(i, "up")}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Nach oben"
                >
                  <GripVertical className="size-4" />
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={topic.title}
                  onChange={(e) => updateTopic(i, "title", e.target.value)}
                  placeholder="Thema"
                  className="font-medium"
                />
                <Input
                  value={topic.description}
                  onChange={(e) => updateTopic(i, "description", e.target.value)}
                  placeholder="Beschreibung (optional)"
                  className="text-sm"
                />
                <Input
                  value={topic.competencyArea}
                  onChange={(e) => updateTopic(i, "competencyArea", e.target.value)}
                  placeholder="Kompetenzbereich (optional)"
                  className="text-xs"
                />
              </div>
              <button
                onClick={() => removeTopic(i)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Thema entfernen"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          <Button variant="outline" onClick={addTopic} className="w-full">
            + Thema hinzufügen
          </Button>
        </div>
      </div>
    );
  }

  // ── View mode ─────────────────────────────────────────────────────────────────
  const competencyAreas = [
    ...new Set(topics.map((t) => t.competencyArea).filter(Boolean)),
  ] as string[];

  const topicsWithoutArea = topics.filter((t) => !t.competencyArea);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lehrplan</h1>
          {curriculum && (
            <p className="text-sm text-muted-foreground">
              {curriculum.sourceFileName
                ? `${curriculum.sourceFileName} · `
                : ""}
              {topics.length} {topics.length === 1 ? "Thema" : "Themen"}
            </p>
          )}
        </div>
        {curriculum && (
          <Button variant="outline" size="sm" onClick={enterEditMode}>
            <Pencil className="mr-1.5 size-3.5" />
            Bearbeiten
          </Button>
        )}
      </div>

      {!curriculum ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Kein Lehrplan hinterlegt</h2>
            <p className="text-sm text-muted-foreground">
              Für diese Klasse wurde noch kein Lehrplan angelegt.
            </p>
          </div>
          <Button onClick={enterEditMode} variant="outline">
            <PenLine className="mr-2 size-4" />
            Lehrplan manuell anlegen
          </Button>
        </div>
      ) : (
        <>
          {competencyAreas.map((area) => (
            <Card key={area}>
              <CardHeader>
                <CardTitle className="text-base">{area}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {topics
                  .filter((t) => t.competencyArea === area)
                  .map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-start gap-3 rounded-md border p-3"
                    >
                      <Badge
                        variant="secondary"
                        className="mt-0.5 shrink-0 text-xs"
                      >
                        {topic.sortOrder + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{topic.title}</p>
                        {topic.description && (
                          <p className="text-xs text-muted-foreground">
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}

          {topicsWithoutArea.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Ohne Kompetenzbereich
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {topicsWithoutArea.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Badge
                      variant="secondary"
                      className="mt-0.5 shrink-0 text-xs"
                    >
                      {topic.sortOrder + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{topic.title}</p>
                      {topic.description && (
                        <p className="text-xs text-muted-foreground">
                          {topic.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {topics.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Noch keine Themen hinterlegt.
              </p>
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                <PenLine className="mr-1.5 size-3.5" />
                Themen hinzufügen
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
