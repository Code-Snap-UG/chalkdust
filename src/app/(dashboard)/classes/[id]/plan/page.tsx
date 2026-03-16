"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

const GENERATING_PHRASES = [
  "Analysiere deine Klasse …",
  "Strukturiere Lernziele …",
  "Wähle passende Methoden …",
  "Erstelle Stundenablauf …",
  "Verfasse Unterrichtsplan …",
];

const PLAN_HINTS: Record<string, { heading: string; body: string; example?: string }> = {
  topicFree: {
    heading: "Thema",
    body: "Formuliere das Thema aus Schülersicht: was wird gelernt, nicht was behandelt wird. Je konkreter, desto passgenauer der Stundenablauf.",
    example: `„Bruchrechnung \u2013 Einf\u00FChrung \u00FCber das Teilen von Fl\u00E4chen\u201C statt nur \u201EBruchrechnung\u201C`,
  },
  goals: {
    heading: "Lernziele",
    body: "Was können die SuS am Ende der Stunde, das sie vorher nicht konnten? Die KI baut alle Phasen auf diese Ziele auf.",
    example: `\u201ESuS k\u00F6nnen einfache Br\u00FCche darstellen und gleichnamige Br\u00FCche vergleichen\u201C`,
  },
  date: {
    heading: "Datum",
    body: "Optional — für das Stundentagebuch. Hat keinen Einfluss auf den Inhalt des Plans.",
  },
  duration: {
    heading: "Dauer",
    body: "Passt die Stundenphasen an die verfügbare Zeit an. Bei 45 Min. konzentriertere Struktur, bei 90 Min. mehr Verarbeitungs- und Übungszeit.",
  },
  notes: {
    heading: "Hinweise",
    body: "Alles, was die KI sonst nicht weiß: Raumsituation, Klassenklima, Vorwissen, besondere SuS, Materialverfügbarkeit.",
    example: `\u201EComputerraum verf\u00FCgbar, 3 SuS noch bei Grundrechenarten\u201C`,
  },
};

const LINE_GROUPS: { width: number; type: "h1" | "h2" | "body"; gapAfter?: boolean }[][] = [
  [
    { width: 62, type: "h1" },
    { width: 84, type: "body" },
    { width: 71, type: "body" },
    { width: 48, type: "body", gapAfter: true },
  ],
  [
    { width: 44, type: "h2" },
    { width: 88, type: "body" },
    { width: 76, type: "body" },
    { width: 58, type: "body" },
    { width: 67, type: "body" },
  ],
];

function GeneratingScreen({ topic }: { topic: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  useEffect(() => {
    const cycle = () => {
      setPhraseVisible(false);
      const t = setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % GENERATING_PHRASES.length);
        setPhraseVisible(true);
      }, 380);
      return t;
    };
    const id = setInterval(cycle, 2900);
    return () => clearInterval(id);
  }, []);

  const allLines = LINE_GROUPS.flat();
  let lineIndex = 0;

  return (
    <>

      <div
        className="ink-stage mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-16 min-h-[70vh]"
        style={{
          animation: "inkFadeIn 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Manuscript block */}
        <div className="w-full max-w-sm flex flex-col">
          {LINE_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-10" : ""}>
              {group.map((line) => {
                const delay = lineIndex++ * 0.27 + 0.12;
                const isH1 = line.type === "h1";
                const isH2 = line.type === "h2";
                return (
                  <div
                    key={`${gi}-${line.width}`}
                    className="ink-line origin-left"
                    style={{
                      width: `${line.width}%`,
                      height: isH1 ? "2.5px" : isH2 ? "2px" : "1.5px",
                      marginBottom: isH1 ? "14px" : isH2 ? "10px" : "8px",
                      borderRadius: "9999px",
                      backgroundColor: isH1
                        ? "oklch(0.52 0.14 40)"
                        : isH2
                        ? "oklch(0.52 0.14 40)"
                        : "oklch(0.14 0.022 55)",
                      opacity: isH1 ? 0.7 : isH2 ? 0.5 : 0.15,
                      transformOrigin: "left center",
                      animation: `inkDraw 0.52s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
                    }}
                  />
                );
              })}
            </div>
          ))}

          {/* Blinking cursor at end of last line */}
          <div
            className="mt-1.5"
            style={{
              width: "2px",
              height: "16px",
              borderRadius: "1px",
              backgroundColor: "oklch(0.52 0.14 40)",
              opacity: 0.8,
              marginLeft: "1px",
              animation: `cursorBlink 1.1s ease-in-out ${allLines.length * 0.27 + 0.12 + 0.52}s infinite`,
            }}
          />
        </div>

        {/* Label */}
        <div className="flex flex-col items-center gap-2.5">
          <p
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "1.4rem",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "oklch(0.14 0.022 55)",
              lineHeight: 1.3,
            }}
          >
            {topic ? `„${topic}"` : "Unterrichtsplan wird erstellt"}
          </p>
          <p
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "oklch(0.52 0.14 40)",
              opacity: phraseVisible ? 1 : 0,
              transform: phraseVisible ? "translateY(0)" : "translateY(4px)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
            }}
          >
            {GENERATING_PHRASES[phraseIndex]}
          </p>
        </div>
      </div>
    </>
  );
}

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Series state
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [selectedSeriesId] = useState(seriesIdParam || "");
  const [selectedMilestoneId] = useState(milestoneIdParam || "");

  // Form state
  const [lessonDate, setLessonDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("90");
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
          durationMinutes: parseInt(durationMinutes) || 90,
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

  if (generating) {
    return <GeneratingScreen topic={topicFreeText} />;
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-10">

      {/* Page header — full width */}
      <div>
        <Link
          href={`/classes/${classGroupId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Klasse
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Stunde planen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gib Kontext ein — die KI erstellt deinen Entwurf und öffnet den
          Editor.
        </p>
      </div>

      {/* Two-column: form left, hint panel right */}
      <div className="flex items-start gap-10 xl:gap-14">

        {/* ── Left: form ─────────────────────── */}
        <div className="flex min-w-0 max-w-2xl flex-1 flex-col gap-5">

          {/* Series context */}
          {seriesInfo && (
            <div className="flex items-start border-l-2 border-primary/40 pl-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">
                  <span className="text-muted-foreground">Reihe —</span>{" "}
                  {seriesInfo.title}
                </p>
                {selectedMilestoneId && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {seriesInfo.milestones.find(
                      (m) => m.id === selectedMilestoneId
                    )?.title}
                  </p>
                )}
                {slotTopicParam && (
                  <p className="mt-0.5 text-xs text-primary/80">{slotTopicParam}</p>
                )}
              </div>
            </div>
          )}

          {/* Topic */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="topicFree"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Thema
            </Label>
            {curriculumTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {curriculumTopics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={topicId === t.id}
                    onClick={() => setTopicId(topicId === t.id ? "" : t.id)}
                    disabled={generating}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      topicId === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}
            <Input
              id="topicFree"
              value={topicFreeText}
              onChange={(e) => setTopicFreeText(e.target.value)}
              onFocus={() => setFocusedField("topicFree")}
              onBlur={() => setFocusedField(null)}
              placeholder={
                curriculumTopics.length > 0
                  ? "Oder freies Thema …"
                  : "z.B. Bruchrechnung – Einführung"
              }
              disabled={generating}
              autoFocus
              className="h-11 text-base"
            />
          </div>

          {/* Learning goals */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="goals"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Lernziele{" "}
              <span className="font-normal normal-case tracking-normal opacity-60">
                optional
              </span>
            </Label>
            <Textarea
              id="goals"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              onFocus={() => setFocusedField("goals")}
              onBlur={() => setFocusedField(null)}
              placeholder="Was sollen die Schüler am Ende können?"
              disabled={generating}
              rows={2}
            />
          </div>

          {/* ── Metadaten ── */}
          <div className="flex flex-col gap-5 border-t border-border pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="date"
                  className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
                >
                  Datum{" "}
                  <span className="font-normal normal-case tracking-normal opacity-60">
                    optional
                  </span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  onFocus={() => setFocusedField("date")}
                  onBlur={() => setFocusedField(null)}
                  disabled={generating}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="duration"
                  className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
                >
                  Dauer
                </Label>
                <Select
                  value={durationMinutes}
                  onValueChange={setDurationMinutes}
                  disabled={generating}
                >
                  <SelectTrigger
                    id="duration"
                    className="w-full"
                    onFocus={() => setFocusedField("duration")}
                    onBlur={() => setFocusedField(null)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 Min.</SelectItem>
                    <SelectItem value="60">60 Min.</SelectItem>
                    <SelectItem value="90">90 Min.</SelectItem>
                    <SelectItem value="120">120 Min.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="notes"
                className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
              >
                Hinweise{" "}
                <span className="font-normal normal-case tracking-normal opacity-60">
                  optional
                </span>
              </Label>
              <Input
                id="notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                onFocus={() => setFocusedField("notes")}
                onBlur={() => setFocusedField(null)}
                placeholder="z.B. Computerraum verfügbar, 3 SuS fehlen"
                disabled={generating}
              />
            </div>
          </div>

          {generateError && (
            <p className="text-sm text-destructive">{generateError}</p>
          )}

          <Button
            onClick={generatePlan}
            disabled={generating || (!topicId && !topicFreeText.trim())}
            size="lg"
            className="w-full"
          >
            <Sparkles className="size-4" />
            Unterrichtsplan erstellen
          </Button>
        </div>

        {/* ── Right: hint panel ──────────────── */}
        <aside className="hidden xl:block w-60 shrink-0 self-start">
          <div
            key={focusedField ?? "__default"}
            className="ink-slipin border-l-2 pl-5"
            style={{
              borderColor: focusedField
                ? "var(--color-primary)"
                : "var(--color-border)",
              animation: "inkSlipIn 0.2s cubic-bezier(0.22,1,0.36,1) both",
              opacity: focusedField
                ? 1
                : undefined,
            }}
          >
            {focusedField && PLAN_HINTS[focusedField] ? (
              <>
                <p className="mb-2.5 text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-primary">
                  {PLAN_HINTS[focusedField].heading}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {PLAN_HINTS[focusedField].body}
                </p>
                {PLAN_HINTS[focusedField].example && (
                  <p className="mt-3 text-xs italic text-muted-foreground/60">
                    {PLAN_HINTS[focusedField].example}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mb-2.5 text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-muted-foreground/50">
                  Tipp
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground/70">
                  Klick in ein Feld — hier erscheinen Hinweise und Beispiele.
                </p>
              </>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
