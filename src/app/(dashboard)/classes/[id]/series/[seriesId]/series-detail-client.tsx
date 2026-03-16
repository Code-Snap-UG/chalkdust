"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Circle,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type DiaryEntry = {
  id: string;
  progressStatus: string;
  entryDate: string;
  plannedSummary: string | null;
  actualSummary: string | null;
};

type LessonPlanWithDiary = {
  id: string;
  topic: string;
  lessonDate: string | null;
  status: string;
  durationMinutes: number;
  diaryEntry: DiaryEntry | null;
};

type LessonSlot = {
  id: string;
  position: number;
  suggestedTopic: string;
  focusAreas: string | null;
  goalsAddressed: unknown;
  notes: string | null;
  isStale: boolean;
};

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  learningGoals: unknown;
  estimatedLessons: number;
  sortOrder: number;
  status: string;
  lessonPlans: LessonPlanWithDiary[];
  lessonSlots: LessonSlot[];
};

type SeriesData = {
  id: string;
  title: string;
  description: string | null;
  estimatedLessons: number;
  estimatedWeeks: number | null;
  status: string;
  milestones: Milestone[];
  unlinkedPlans: LessonPlanWithDiary[];
};

type ClassGroup = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  status: string;
};

function buildPlanUrl(
  classGroupId: string,
  seriesId: string,
  milestoneId: string,
  slots: LessonSlot[],
  nextPosition: number
): string {
  const base = `/classes/${classGroupId}/plan?seriesId=${seriesId}&milestoneId=${milestoneId}`;
  const slot = slots.find((s) => s.position === nextPosition);
  if (!slot) return base;
  const params = new URLSearchParams({
    seriesId,
    milestoneId,
    slotTopic: slot.suggestedTopic,
    ...(slot.focusAreas ? { slotFocus: slot.focusAreas } : {}),
    ...(Array.isArray(slot.goalsAddressed) && slot.goalsAddressed.length > 0
      ? {
          slotGoals: (slot.goalsAddressed as { text: string }[])
            .map((g) => g.text)
            .join("; "),
        }
      : {}),
  });
  return `/classes/${classGroupId}/plan?${params.toString()}`;
}

function parseLearningGoals(goals: unknown): { text: string }[] {
  if (!Array.isArray(goals)) return [];
  return goals.filter(
    (g): g is { text: string } =>
      typeof g === "object" && g !== null && typeof (g as { text?: unknown }).text === "string"
  );
}

function getLessonStatus(plan: LessonPlanWithDiary): {
  label: string;
  color: string;
} {
  const diary = plan.diaryEntry;
  if (!diary) {
    return plan.status === "approved"
      ? { label: "Geplant", color: "bg-primary" }
      : { label: "Entwurf", color: "bg-muted-foreground/40" };
  }
  switch (diary.progressStatus) {
    case "completed":
      return { label: "Abgeschlossen", color: "bg-emerald-500" };
    case "partial":
      return { label: "Teilweise", color: "bg-amber-500" };
    case "deviated":
      return { label: "Abgewichen", color: "bg-amber-500" };
    default:
      return { label: "Geplant", color: "bg-primary" };
  }
}

function getMilestoneCompletedCount(m: Milestone): number {
  return m.lessonPlans.filter(
    (p) =>
      p.diaryEntry &&
      ["completed", "partial", "deviated"].includes(p.diaryEntry.progressStatus)
  ).length;
}

function isMilestoneDone(m: Milestone): boolean {
  if (m.status === "completed") return true;
  if (m.lessonPlans.length === 0) return false;
  return m.lessonPlans.every(
    (p) =>
      p.diaryEntry &&
      ["completed", "partial", "deviated"].includes(p.diaryEntry.progressStatus)
  );
}

export function SeriesDetailClient({
  classGroupId,
  classGroup,
  series: initialSeries,
}: {
  classGroupId: string;
  classGroup: ClassGroup;
  series: SeriesData;
}) {
  const searchParams = useSearchParams();
  const [series, setSeries] = useState(initialSeries);
  const [showGeneratedNotice, setShowGeneratedNotice] = useState(
    searchParams.get("from") === "generate"
  );
  const isArchived = classGroup.status === "archived";

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEstLessons, setEditEstLessons] = useState(1);
  const [editGoals, setEditGoals] = useState<{ text: string }[]>([]);
  const [newGoalText, setNewGoalText] = useState("");

  // Arc panel state
  const [arcLoadingId, setArcLoadingId] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editSlotTopic, setEditSlotTopic] = useState("");
  const [editSlotFocus, setEditSlotFocus] = useState("");

  const totalPlanned = series.milestones.reduce(
    (sum, m) => sum + m.lessonPlans.length,
    0
  ) + series.unlinkedPlans.length;

  const totalCompleted = series.milestones.reduce(
    (sum, m) => sum + getMilestoneCompletedCount(m),
    0
  );

  const firstInProgressIdx = series.milestones.findIndex(
    (m) => !isMilestoneDone(m)
  );

  function startEditMilestone(m: Milestone) {
    setEditingMilestoneId(m.id);
    setEditTitle(m.title);
    setEditDescription(m.description || "");
    setEditEstLessons(m.estimatedLessons);
    setEditGoals(parseLearningGoals(m.learningGoals));
    setNewGoalText("");
  }

  async function saveEditMilestone() {
    if (!editingMilestoneId) return;
    const res = await fetch(
      `/api/series/${series.id}/milestones/${editingMilestoneId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          estimatedLessons: editEstLessons,
          learningGoals: editGoals,
        }),
      }
    );
    if (res.ok) {
      const updated = await res.json();
      setSeries((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === editingMilestoneId ? { ...m, ...updated } : m
        ),
      }));
    }
    setEditingMilestoneId(null);
  }

  async function confirmDeleteMilestone(milestoneId: string) {
    const res = await fetch(
      `/api/series/${series.id}/milestones/${milestoneId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setSeries((prev) => ({
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== milestoneId),
      }));
    }
    setDeletingMilestoneId(null);
  }

  async function generateArc(milestoneId: string) {
    setArcLoadingId(milestoneId);
    try {
      const res = await fetch(
        `/api/series/${series.id}/milestones/${milestoneId}/arc`,
        { method: "POST" }
      );
      if (res.ok) {
        const slots: LessonSlot[] = await res.json();
        setSeries((prev) => ({
          ...prev,
          milestones: prev.milestones.map((m) =>
            m.id === milestoneId ? { ...m, lessonSlots: slots } : m
          ),
        }));
      }
    } finally {
      setArcLoadingId(null);
    }
  }

  function startEditSlot(slot: LessonSlot) {
    setEditingSlotId(slot.id);
    setEditSlotTopic(slot.suggestedTopic);
    setEditSlotFocus(slot.focusAreas ?? "");
  }

  async function saveSlotEdit(milestoneId: string, slotId: string) {
    const res = await fetch(`/api/series/${series.id}/milestones/${milestoneId}/arc/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suggestedTopic: editSlotTopic,
        focusAreas: editSlotFocus || null,
      }),
    });
    if (res.ok) {
      const updated: LessonSlot = await res.json();
      setSeries((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                lessonSlots: m.lessonSlots.map((s) =>
                  s.id === slotId ? updated : s
                ),
              }
            : m
        ),
      }));
    }
    setEditingSlotId(null);
  }

  async function addNewMilestone() {
    const res = await fetch(`/api/series/${series.id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Neuer Meilenstein",
        estimatedLessons: 1,
        learningGoals: [],
      }),
    });
    if (res.ok) {
      const newMilestone = await res.json();
      const full: Milestone = { ...newMilestone, lessonPlans: [], lessonSlots: [] };
      setSeries((prev) => ({
        ...prev,
        milestones: [...prev.milestones, full],
      }));
      startEditMilestone(full);
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-6">
      {/* Header */}
      <div>
        <Link
          href={`/classes/${classGroupId}/series`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Unterrichtsreihen
        </Link>
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl font-bold tracking-tight">{series.title}</h1>
          <Badge
            variant={
              series.status === "active"
                ? "default"
                : series.status === "completed"
                  ? "secondary"
                  : "outline"
            }
            className="shrink-0 text-xs"
          >
            {series.status === "active"
              ? "Aktiv"
              : series.status === "completed"
                ? "Abgeschlossen"
                : "Entwurf"}
          </Badge>
        </div>
        <p className="mt-1 text-muted-foreground">
          {classGroup.name} &middot; {classGroup.subject} &middot;{" "}
          {series.estimatedLessons} Stunden
          {series.estimatedWeeks ? ` · ~${series.estimatedWeeks} Wochen` : ""}
        </p>

        {series.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {series.description}
          </p>
        )}

        {/* Segmented progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="font-medium">
              {totalCompleted}/{totalPlanned || series.estimatedLessons} Stunden
            </span>
          </div>
          <div className="flex gap-0.5">
            {series.milestones.map((m) => {
              const est = m.estimatedLessons;
              const done = getMilestoneCompletedCount(m);
              const full = isMilestoneDone(m);
              return (
                <div
                  key={m.id}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                  title={`${m.title}: ${done}/${est}`}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      full ? "bg-primary" : done > 0 ? "bg-primary/50" : ""
                    }`}
                    style={{
                      width: full
                        ? "100%"
                        : est > 0
                          ? `${(done / est) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Milestone Timeline */}
      {showGeneratedNotice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            <p>
              Reihe erstellt. Du kannst Meilensteine jetzt direkt hier anpassen.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowGeneratedNotice(false)}
          >
            Schließen
          </Button>
        </div>
      )}

      <div className="relative">
        {series.milestones.map((milestone, idx) => {
          const done = isMilestoneDone(milestone);
          const isCurrent = idx === firstInProgressIdx;
          const goals = parseLearningGoals(milestone.learningGoals);
          const completedCount = getMilestoneCompletedCount(milestone);
          const isEditing = editingMilestoneId === milestone.id;

          return (
            <div
              key={milestone.id}
              className="group relative flex gap-4 pb-8 last:pb-0"
            >
              {/* Left column: line + node */}
              <div className="flex w-8 shrink-0 flex-col items-center">
                {/* Node */}
                <div
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition duration-200 ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background"
                        : "border-border bg-background"
                  }`}
                >
                  {done ? (
                    <Check className="size-4" />
                  ) : isCurrent ? (
                    <>
                      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
                      <Circle className="size-3 fill-primary text-primary" />
                    </>
                  ) : (
                    <Circle className="size-3 text-muted-foreground/40" />
                  )}
                </div>
                {/* Connecting line */}
                {idx < series.milestones.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 ${
                      done ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Right column: card */}
              <div
                className={`min-w-0 flex-1 rounded-xl border p-4 transition duration-200 ${
                  done
                    ? "border-border/60 bg-muted/30"
                    : isCurrent
                      ? "border-primary/30 bg-card shadow-sm"
                      : "border-border"
                }`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`milestone-title-${milestone.id}`}>
                        Meilensteintitel
                      </Label>
                      <Input
                        id={`milestone-title-${milestone.id}`}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="z.B. Einführung in die Grammatik"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`milestone-desc-${milestone.id}`}>
                        Beschreibung{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        id={`milestone-desc-${milestone.id}`}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Kurze Beschreibung des Meilensteins…"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`milestone-lessons-${milestone.id}`}>
                        Geschätzte Stunden
                      </Label>
                      <Input
                        id={`milestone-lessons-${milestone.id}`}
                        type="number"
                        value={editEstLessons}
                        onChange={(e) =>
                          setEditEstLessons(parseInt(e.target.value) || 1)
                        }
                        min={1}
                        className="w-24"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Lernziele</Label>
                      {editGoals.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {editGoals.map((g, gi) => (
                            <span
                              key={gi}
                              className="flex items-center gap-1 rounded-full border border-border bg-muted/40 pl-2.5 pr-1 py-0.5 text-xs"
                            >
                              {g.text}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditGoals((prev) =>
                                    prev.filter((_, i) => i !== gi)
                                  )
                                }
                                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                                aria-label="Lernziel entfernen"
                              >
                                <X className="size-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <Input
                          value={newGoalText}
                          onChange={(e) => setNewGoalText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = newGoalText.trim();
                              if (trimmed) {
                                setEditGoals((prev) => [...prev, { text: trimmed }]);
                                setNewGoalText("");
                              }
                            }
                          }}
                          placeholder="Lernziel eingeben und Enter drücken…"
                          className="flex-1 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const trimmed = newGoalText.trim();
                            if (trimmed) {
                              setEditGoals((prev) => [...prev, { text: trimmed }]);
                              setNewGoalText("");
                            }
                          }}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={saveEditMilestone}>
                        <Check className="mr-1 size-3" />
                        Speichern
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingMilestoneId(null)}
                      >
                        <X className="mr-1 size-3" />
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Inline delete confirmation */}
                    {deletingMilestoneId === milestone.id && (
                      <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                        <p className="text-sm text-foreground">
                          Meilenstein{milestone.lessonPlans.length > 0 ? " und alle verknüpften Stunden" : ""} löschen?
                        </p>
                        <div className="flex shrink-0 gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDeletingMilestoneId(null)}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => confirmDeleteMilestone(milestone.id)}
                          >
                            Löschen
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-lg font-semibold line-clamp-2 ${
                              done ? "text-muted-foreground" : ""
                            }`}
                          >
                            {milestone.title}
                          </h3>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {isCurrent && milestone.lessonPlans.length > 0
                              ? `${completedCount}/${milestone.estimatedLessons} St.`
                              : `${milestone.estimatedLessons} St.`}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {done && (
                          <Badge variant="secondary" className="text-xs">
                            Fertig
                          </Badge>
                        )}
                        {!done && !isArchived && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditMilestone(milestone)}
                              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity duration-150 hover:text-foreground group-hover:opacity-100"
                              aria-label="Meilenstein bearbeiten"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingMilestoneId(milestone.id)}
                              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity duration-150 hover:text-destructive group-hover:opacity-100"
                              aria-label="Meilenstein löschen"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {milestone.description && (
                      <p
                        className={`mt-1 text-sm ${
                          done
                            ? "text-muted-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {milestone.description}
                      </p>
                    )}

                    {/* Learning goals as chips */}
                    {goals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {goals.map((g, gi) => (
                          <span
                            key={gi}
                            className={`rounded-full border px-2.5 py-0.5 text-xs ${
                              done
                                ? "border-border/50 text-muted-foreground/50"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {g.text}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Linked lessons */}
                    {milestone.lessonPlans.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Stunden
                        </p>
                        <div className="flex flex-col">
                          {milestone.lessonPlans.map((plan, pi) => {
                            const st = getLessonStatus(plan);
                            return (
                              <Link
                                key={plan.id}
                                href={`/lesson-plans/${plan.id}`}
                                className="flex items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-sm transition-colors hover:bg-muted/50 -mx-1.5"
                              >
                                <span
                                  className={`size-1.5 shrink-0 rounded-full ${st.color}`}
                                />
                                <span className="w-16 shrink-0 text-xs text-muted-foreground tabular-nums">
                                  {plan.lessonDate
                                    ? new Date(plan.lessonDate).toLocaleDateString("de-DE", { day: "numeric", month: "short" })
                                    : `Std. ${pi + 1}`}
                                </span>
                                <span className="flex-1 text-sm font-medium line-clamp-1">
                                  {plan.topic}
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground/60">
                                  {st.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Arc panel: Stundenverteilung */}
                    {!done && (
                      <div className="mt-4 border-t pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Stundenverteilung
                          </p>
                          {milestone.lessonSlots.length > 0 && !isArchived && (
                            <button
                              type="button"
                              onClick={() => generateArc(milestone.id)}
                              disabled={arcLoadingId === milestone.id}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                              {arcLoadingId === milestone.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <RotateCcw className="size-3" />
                              )}
                              Neu generieren
                            </button>
                          )}
                        </div>

                        {milestone.lessonSlots.length === 0 ? (
                          <div className="flex items-center gap-2">
                            {!isArchived && (
                              <button
                                type="button"
                                onClick={() => generateArc(milestone.id)}
                                disabled={arcLoadingId === milestone.id}
                                className="flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                              >
                                {arcLoadingId === milestone.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Sparkles className="size-3" />
                                )}
                                Stundenverteilung vorschlagen
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {milestone.lessonSlots.map((slot) => {
                              const isEditingSlot = editingSlotId === slot.id;
                              return (
                                <div
                                  key={slot.id}
                                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                    slot.isStale
                                      ? "border-amber-200 bg-amber-50/50"
                                      : "border-border bg-muted/20"
                                  }`}
                                >
                                  {isEditingSlot ? (
                                    <div className="flex flex-col gap-2">
                                      <input
                                        autoFocus
                                        value={editSlotTopic}
                                        onChange={(e) => setEditSlotTopic(e.target.value)}
                                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Thema"
                                      />
                                      <input
                                        value={editSlotFocus}
                                        onChange={(e) => setEditSlotFocus(e.target.value)}
                                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Schwerpunkt (optional)"
                                      />
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => saveSlotEdit(milestone.id, slot.id)}
                                          className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground"
                                        >
                                          <Check className="size-3" />
                                          Speichern
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingSlotId(null)}
                                          className="flex items-center gap-1 rounded border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                          <X className="size-3" />
                                          Abbrechen
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="group/slot cursor-pointer"
                                      onClick={() =>
                                        !isArchived && startEditSlot(slot)
                                      }
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-baseline gap-2">
                                            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                                              {slot.position}.
                                            </span>
                                            <span className="font-medium">
                                              {slot.suggestedTopic}
                                            </span>
                                          </div>
                                          <div className="flex shrink-0 items-center gap-1.5">
                                            {slot.isStale && (
                                              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                                                <AlertTriangle className="size-2.5" />
                                                Veraltet
                                              </span>
                                            )}
                                            {!isArchived && (
                                              <>
                                                <Link
                                                  href={buildPlanUrl(classGroupId, series.id, milestone.id, milestone.lessonSlots, slot.position)}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover/slot:opacity-100"
                                                  title="Stunde planen"
                                                >
                                                  <Sparkles className="size-3" />
                                                </Link>
                                                <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/slot:opacity-100" />
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      {slot.focusAreas && (
                                        <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
                                          {slot.focusAreas}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action: plan next lesson */}
                    {isCurrent && !isArchived && (
                      <div className="mt-3">
                        <Button size="sm" asChild>
                          <Link
                            href={buildPlanUrl(classGroupId, series.id, milestone.id, milestone.lessonSlots, milestone.lessonPlans.length + 1)}
                          >
                            <Sparkles className="mr-1.5 size-3.5" />
                            Nächste Stunde planen
                          </Link>
                        </Button>
                      </div>
                    )}

                    {/* Pending milestone: subtle plan link on hover */}
                    {!done && !isCurrent && !isArchived && (
                      <div className="mt-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        <Button size="sm" variant="ghost" asChild>
                          <Link
                            href={buildPlanUrl(classGroupId, series.id, milestone.id, milestone.lessonSlots, milestone.lessonPlans.length + 1)}
                          >
                            <Sparkles className="mr-1.5 size-3.5" />
                            Stunde planen
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add milestone button */}
      {!isArchived && (
        <Button variant="outline" size="sm" onClick={addNewMilestone} className="self-start">
          <Plus className="mr-1.5 size-3.5" />
          Meilenstein hinzufügen
        </Button>
      )}

      {/* Unlinked lesson plans */}
      {series.unlinkedPlans.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nicht zugeordnete Stunden
            </h3>
          </div>
          <div className="flex flex-col border-t">
            {series.unlinkedPlans.map((plan) => {
              const st = getLessonStatus(plan);
              return (
                <Link
                  key={plan.id}
                  href={`/lesson-plans/${plan.id}`}
                  className="group flex items-center gap-3 border-b py-3 -mx-1 px-1 rounded-sm transition-colors hover:bg-muted/40"
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${st.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1">{plan.topic}</p>
                    {plan.lessonDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(plan.lessonDate).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{st.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
