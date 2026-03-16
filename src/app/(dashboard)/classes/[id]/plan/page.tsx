"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";

type CurriculumTopic = {
  id: string;
  title: string;
  description: string | null;
  competencyArea: string | null;
};

type SeriesMilestone = {
  id: string;
  title: string;
  description: string | null;
  learningGoals: { text: string }[];
  estimatedLessons: number;
};

type SeriesInfo = {
  id: string;
  title: string;
  description: string | null;
  milestones: SeriesMilestone[];
};

export default function PlanLessonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classGroupId = params.id as string;

  const seriesIdParam = searchParams.get("seriesId");
  const milestoneIdParam = searchParams.get("milestoneId");
  const slotTopicParam = searchParams.get("slotTopic");
  const slotFocusParam = searchParams.get("slotFocus");
  const slotGoalsParam = searchParams.get("slotGoals");

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Series state
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [selectedSeriesId] = useState(seriesIdParam || "");
  const [selectedMilestoneId] = useState(milestoneIdParam || "");

  // Form state
  const [lessonDate, setLessonDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [topicId, setTopicId] = useState("");
  const [topicFreeText, setTopicFreeText] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  const { data: classData } = useSWR<{ status?: string }>(
    `/api/classes/${classGroupId}`,
    fetcher
  );
  const { data: topicsData } = useSWR<{ topics?: CurriculumTopic[] }>(
    `/api/classes/${classGroupId}/topics`,
    fetcher
  );

  const curriculumTopics = topicsData?.topics ?? [];

  // Fetch series data when seriesId is provided
  useEffect(() => {
    if (!selectedSeriesId) {
      setSeriesInfo(null);
      return;
    }
    fetch(`/api/series/${selectedSeriesId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setSeriesInfo({
            id: data.id,
            title: data.title,
            description: data.description,
            milestones: (data.milestones || []).map((m: SeriesMilestone & { id: string }) => ({
              id: m.id,
              title: m.title,
              description: m.description,
              learningGoals: Array.isArray(m.learningGoals) ? m.learningGoals : [],
              estimatedLessons: m.estimatedLessons,
            })),
          });
        }
      })
      .catch(() => {});
  }, [selectedSeriesId]);

  // Pre-populate form: slot params take priority over milestone-level data
  useEffect(() => {
    if (slotTopicParam) {
      setTopicFreeText(slotTopicParam);
      if (slotGoalsParam) setLearningGoals(slotGoalsParam);
      if (slotFocusParam) setAdditionalNotes(slotFocusParam);
      return;
    }
    if (!seriesInfo || !selectedMilestoneId) return;
    const milestone = seriesInfo.milestones.find(
      (m) => m.id === selectedMilestoneId
    );
    if (milestone) {
      if (!topicFreeText) setTopicFreeText(milestone.title);
      if (!learningGoals && milestone.learningGoals.length > 0) {
        setLearningGoals(milestone.learningGoals.map((g) => g.text).join("; "));
      }
    }
  }, [
    seriesInfo,
    selectedMilestoneId,
    slotTopicParam,
    slotGoalsParam,
    slotFocusParam,
    topicFreeText,
    learningGoals,
  ]);

  // Redirect if the class is archived
  useEffect(() => {
    if (classData?.status === "archived") {
      router.replace(`/classes/${classGroupId}`);
    }
  }, [classData, classGroupId, router]);

  async function generatePlan() {
    setGenerateError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/lesson-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGroupId,
          lessonDate: lessonDate || undefined,
          durationMinutes: parseInt(durationMinutes) || 45,
          topicId: topicId || undefined,
          topicFreeText: topicFreeText || undefined,
          learningGoals: learningGoals || undefined,
          additionalNotes: additionalNotes || undefined,
          seriesId: selectedSeriesId || undefined,
          milestoneId: selectedMilestoneId || undefined,
        }),
      });

      if (!res.ok) {
        setGenerateError("Fehler bei der Planerstellung. Bitte erneut versuchen.");
        return;
      }

      const data = await res.json();
      if (!data?.id) {
        setGenerateError("Plan konnte nicht geladen werden. Bitte erneut versuchen.");
        return;
      }
      router.push(`/lesson-plans/${data.id}?from=generate`);
    } catch {
      setGenerateError("Fehler bei der Planerstellung. Bitte erneut versuchen.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Stunde planen</h1>
        <p className="text-muted-foreground">
          Gib Kontext ein. Danach erstellt die KI deinen Entwurf und öffnet
          direkt den Editor.
        </p>
      </div>

      {/* Series context banner */}
      {seriesInfo && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <Layers className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Reihe: {seriesInfo.title}
            </p>
            {selectedMilestoneId && (
              <p className="text-xs text-muted-foreground">
                Meilenstein:{" "}
                {seriesInfo.milestones.find(
                  (m) => m.id === selectedMilestoneId
                )?.title || ""}
              </p>
            )}
            {slotTopicParam && (
              <p className="mt-0.5 text-xs text-primary/80">
                Stundenverteilung: {slotTopicParam}
              </p>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stundendetails</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="date" className="text-xs">
                Datum
              </Label>
              <Input
                id="date"
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                disabled={generating}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="duration" className="text-xs">
                Dauer (Min.)
              </Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min={15}
                max={180}
                disabled={generating}
              />
            </div>
          </div>

          {curriculumTopics.length > 0 && (
            <div className="grid gap-1.5">
              <Label htmlFor="topic" className="text-xs">
                Thema aus dem Lehrplan
              </Label>
              <select
                id="topic"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                disabled={generating}
              >
                <option value="">-- Thema wählen --</option>
                {curriculumTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="topicFree" className="text-xs">
              Oder freies Thema
            </Label>
            <Input
              id="topicFree"
              value={topicFreeText}
              onChange={(e) => setTopicFreeText(e.target.value)}
              placeholder="z.B. Bruchrechnung – Einführung"
              disabled={generating}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="goals" className="text-xs">
              Lernziele (optional)
            </Label>
            <Input
              id="goals"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              placeholder="Was sollen die Schüler am Ende können?"
              disabled={generating}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-xs">
              Zusätzliche Hinweise (optional)
            </Label>
            <Input
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="z.B. Computerraum verfügbar, 3 SuS fehlen"
              disabled={generating}
            />
          </div>

          {generateError && (
            <p className="text-sm text-destructive">{generateError}</p>
          )}

          <Button
            onClick={generatePlan}
            disabled={generating || (!topicId && !topicFreeText.trim())}
            className="mt-2"
          >
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Unterrichtsplan erstellen
          </Button>

          {generating && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              KI erstellt deinen Unterrichtsplan...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
