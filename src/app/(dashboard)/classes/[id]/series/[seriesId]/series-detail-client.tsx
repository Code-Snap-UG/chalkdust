"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  Circle,
  Pencil,
  Plus,
  Sparkles,
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

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  learningGoals: unknown;
  estimatedLessons: number;
  sortOrder: number;
  status: string;
  lessonPlans: LessonPlanWithDiary[];
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
      ? { label: "Geplant", color: "bg-blue-500" }
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
      return { label: "Geplant", color: "bg-blue-500" };
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
  const router = useRouter();
  const [series, setSeries] = useState(initialSeries);
  const isArchived = classGroup.status === "archived";

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEstLessons, setEditEstLessons] = useState(1);

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
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <Link
          href={`/classes/${classGroupId}/series`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Unterrichtsreihen
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{series.title}</h1>
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
                  className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                  title={`${m.title}: ${done}/${est}`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
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
              className="relative flex gap-4 pb-8 last:pb-0"
              style={{
                animationDelay: `${idx * 75}ms`,
              }}
            >
              {/* Left column: line + node */}
              <div className="flex w-8 shrink-0 flex-col items-center">
                {/* Node */}
                <div
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
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
                className={`min-w-0 flex-1 rounded-xl border p-4 transition-all ${
                  done
                    ? "bg-muted/30"
                    : isCurrent
                      ? "ring-1 ring-primary/20 shadow-md"
                      : ""
                }`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="font-semibold"
                    />
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Geschätzte Stunden:
                      </span>
                      <Input
                        type="number"
                        value={editEstLessons}
                        onChange={(e) =>
                          setEditEstLessons(parseInt(e.target.value) || 1)
                        }
                        min={1}
                        className="w-20"
                      />
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
                          {isCurrent &&
                            milestone.lessonPlans.length > 0 && (
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                {completedCount} von{" "}
                                {milestone.estimatedLessons} St.
                              </Badge>
                            )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {done && (
                          <Badge variant="default" className="text-xs">
                            Fertig
                          </Badge>
                        )}
                        {!done && !isArchived && (
                          <button
                            onClick={() => startEditMilestone(milestone)}
                            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 [div:hover>&]:opacity-100"
                          >
                            <Pencil className="size-3.5" />
                          </button>
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
                      <div className="mt-3 flex flex-col gap-1.5">
                        {milestone.lessonPlans.map((plan, pi) => {
                          const st = getLessonStatus(plan);
                          return (
                            <Link
                              key={plan.id}
                              href={`/lesson-plans/${plan.id}`}
                              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/50"
                            >
                              <span
                                className={`size-2 shrink-0 rounded-full ${st.color}`}
                              />
                              <span className="text-xs text-muted-foreground shrink-0">
                                Stunde {pi + 1}
                                {plan.lessonDate &&
                                  ` · ${new Date(plan.lessonDate).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}`}
                              </span>
                              <span className="flex-1 font-medium line-clamp-1">
                                {plan.topic}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Action: plan next lesson */}
                    {isCurrent && !isArchived && (
                      <div className="mt-3">
                        <Button size="sm" asChild>
                          <Link
                            href={`/classes/${classGroupId}/plan?seriesId=${series.id}&milestoneId=${milestone.id}`}
                          >
                            <Sparkles className="mr-1.5 size-3.5" />
                            Nächste Stunde planen
                          </Link>
                        </Button>
                      </div>
                    )}

                    {/* Pending milestone: subtle plan link on hover */}
                    {!done && !isCurrent && !isArchived && (
                      <div className="mt-3 opacity-0 transition-opacity [div:hover>&]:opacity-100">
                        <Button size="sm" variant="ghost" asChild>
                          <Link
                            href={`/classes/${classGroupId}/plan?seriesId=${series.id}&milestoneId=${milestone.id}`}
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
          Milestone hinzufügen
        </Button>
      )}
    </div>
  );
}
