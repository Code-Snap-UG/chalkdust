"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles } from "lucide-react";

const SERIES_PHRASES = [
  "Analysiere Lernziele …",
  "Entwickle Meilensteine …",
  "Strukturiere Unterrichtsreihe …",
  "Verteile Lernprogression …",
  "Verfasse Meilensteinplan …",
];

// Three milestone groups: each has a thick heading line + body lines
const MILESTONE_GROUPS = [
  [{ type: "h" as const, width: 58 }, { type: "b" as const, width: 82 }, { type: "b" as const, width: 67 }],
  [{ type: "h" as const, width: 44 }, { type: "b" as const, width: 76 }, { type: "b" as const, width: 53 }, { type: "b" as const, width: 88 }],
  [{ type: "h" as const, width: 62 }, { type: "b" as const, width: 71 }, { type: "b" as const, width: 48 }],
];

function SeriesGeneratingScreen({ seriesTitle }: { seriesTitle: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  useEffect(() => {
    const cycle = () => {
      setPhraseVisible(false);
      const t = setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % SERIES_PHRASES.length);
        setPhraseVisible(true);
      }, 380);
      return t;
    };
    const id = setInterval(cycle, 2900);
    return () => clearInterval(id);
  }, []);

  let lineIndex = 0;
  const allLineCount = MILESTONE_GROUPS.flat().length;

  return (
    <div
      className="ink-stage mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-16 min-h-[70vh]"
      style={{ animation: "inkFadeIn 0.55s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      {/* Three milestone sketches */}
      <div className="w-full max-w-sm flex flex-col">
        {MILESTONE_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-8" : ""}>
            {group.map((line) => {
              const isH = line.type === "h";
              const delay = lineIndex++ * 0.24 + 0.1;
              return (
                <div
                  key={`${gi}-${line.width}`}
                  className="ink-line origin-left"
                  style={{
                    width: `${line.width}%`,
                    height: isH ? "2.5px" : "1.5px",
                    marginBottom: isH ? "10px" : "7px",
                    borderRadius: "9999px",
                    backgroundColor: isH
                      ? "oklch(0.52 0.14 40)"
                      : "oklch(0.14 0.022 55)",
                    opacity: isH ? 0.65 : 0.13,
                    transformOrigin: "left center",
                    animation: `inkDraw 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Blinking cursor */}
        <div
          className="ink-cursor mt-2"
          style={{
            width: "2px",
            height: "14px",
            borderRadius: "1px",
            backgroundColor: "oklch(0.52 0.14 40)",
            opacity: 0.75,
            animation: `cursorBlink 1.1s ease-in-out ${allLineCount * 0.24 + 0.1 + 0.5}s infinite`,
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
          {seriesTitle ? `„${seriesTitle}"` : "Unterrichtsreihe wird erstellt"}
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
          {SERIES_PHRASES[phraseIndex]}
        </p>
      </div>
    </div>
  );
}

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

const SERIES_HINTS: Record<string, { heading: string; body: string; example?: string }> = {
  title: {
    heading: "Titel der Reihe",
    body: "Benennt die Lernsequenz in wenigen Wörtern. Erscheint auf der Übersichtsseite und in der Meilensteinplanung.",
    example: `\u201EPodiumsdiskussion\u201C, \u201EGleichungen l\u00F6sen \u2013 Einstieg\u201C`,
  },
  description: {
    heading: "Ziel der Reihe",
    body: "Das wichtigste Feld für gute KI-Ergebnisse. Beschreibe das Kompetenzziel: was können die SuS nach der Reihe, das sie vorher nicht konnten? Die KI strukturiert alle Meilensteine auf dieses Ziel hin.",
    example: `\u201ESuS k\u00F6nnen eine strukturierte Debatte mit Gegenargumenten f\u00FChren\u201C`,
  },
  notes: {
    heading: "Hinweise",
    body: "Klassenspezifische Besonderheiten, die die KI einbeziehen soll: Vorwissen, Lerntempo, Raumressourcen, individuelle Schwerpunkte.",
    example: `\u201EKlasse hat wenig Erfahrung mit freiem Sprechen\u201C`,
  },
  lessons: {
    heading: "Geschätzte Stunden",
    body: "Bestimmt die Granularität der Meilensteine. Weniger Stunden → kompakte Meilensteine. Mehr Stunden → feinere Progression und mehr Tiefe.",
  },
  weeks: {
    heading: "Geschätzte Wochen",
    body: "Hilft der KI, realistische Zeitpuffer einzuplanen und die Progression auf das Schulhalbjahr zu verteilen.",
  },
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

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function toggleTopic(topicId: string) {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }

  async function createSeriesWithMilestones(
    generatedMilestones: MilestoneData[],
    source: "generate" | "manual"
  ) {
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/classes/${classGroupId}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          estimatedLessons: parseInt(estimatedLessons) || 8,
          estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks) : undefined,
          milestones: generatedMilestones.filter((m) => m.title.trim()),
          curriculumTopicIds: selectedTopicIds.length
            ? selectedTopicIds
            : undefined,
        }),
      });
      if (!res.ok) {
        setErrorMessage("Fehler beim Speichern der Reihe.");
        return;
      }
      const data = await res.json();
      const suffix = source === "generate" ? "?from=generate" : "";
      router.push(`/classes/${classGroupId}/series/${data.id}${suffix}`);
    } catch {
      setErrorMessage("Fehler beim Speichern der Reihe.");
    } finally {
      setSaving(false);
    }
  }

  async function generateMilestones() {
    setGenerating(true);
    setErrorMessage(null);
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
        setErrorMessage("Fehler bei der Meilenstein-Generierung.");
        return;
      }
      const data = await res.json();
      await createSeriesWithMilestones(data.milestones ?? [], "generate");
    } catch {
      setErrorMessage("Fehler bei der Meilenstein-Generierung.");
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate = title.trim() && description.trim();
  const canCreateManual = title.trim() && parseInt(estimatedLessons) > 0;

  if (generating || saving) {
    return <SeriesGeneratingScreen seriesTitle={title} />;
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-10">

      {/* Page header — full width */}
      <div>
        <Link
          href={`/classes/${classGroupId}/series`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Unterrichtsreihen
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Neue Unterrichtsreihe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {classDisplayName} &middot; {subject} &middot; Klasse {grade}
        </p>
      </div>

      {/* Two-column: form left, hint panel right */}
      <div className="flex items-start gap-10 xl:gap-14">

        {/* ── Left: form ─────────────────────── */}
        <div className="flex min-w-0 max-w-2xl flex-1 flex-col gap-5">

          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="title"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Titel
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setFocusedField("title")}
              onBlur={() => setFocusedField(null)}
              placeholder="z.B. Podiumsdiskussion"
              disabled={generating || saving}
              autoFocus
              className="h-11 text-base"
            />
          </div>

          {/* Description / goal */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="description"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Ziel
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setFocusedField("description")}
              onBlur={() => setFocusedField(null)}
              placeholder="z.B. SuS können eine strukturierte Podiumsdiskussion führen"
              rows={3}
              disabled={generating || saving}
            />
          </div>

          {/* Curriculum topic chips — multi-select */}
          {curriculumTopics.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                Lehrplan-Themen{" "}
                <span className="font-normal normal-case tracking-normal opacity-60">
                  optional
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {curriculumTopics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={selectedTopicIds.includes(t.id)}
                    onClick={() => toggleTopic(t.id)}
                    disabled={generating || saving}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      selectedTopicIds.includes(t.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
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
              placeholder="z.B. Klasse hat wenig Erfahrung mit freiem Sprechen"
              disabled={generating || saving}
            />
          </div>

          {/* ── Struktur ── */}
          <div className="flex flex-col gap-5 border-t border-border pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="lessons"
                  className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
                >
                  Geschätzte Stunden
                </Label>
                <Input
                  id="lessons"
                  type="number"
                  value={estimatedLessons}
                  onChange={(e) => setEstimatedLessons(e.target.value)}
                  onFocus={() => setFocusedField("lessons")}
                  onBlur={() => setFocusedField(null)}
                  min={1}
                  max={100}
                  disabled={generating || saving}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="weeks"
                  className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
                >
                  Geschätzte Wochen{" "}
                  <span className="font-normal normal-case tracking-normal opacity-60">
                    optional
                  </span>
                </Label>
                <Input
                  id="weeks"
                  type="number"
                  value={estimatedWeeks}
                  onChange={(e) => setEstimatedWeeks(e.target.value)}
                  onFocus={() => setFocusedField("weeks")}
                  onBlur={() => setFocusedField(null)}
                  min={1}
                  max={52}
                  disabled={generating || saving}
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          {/* Actions — primary + secondary */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={generateMilestones}
              disabled={!canGenerate}
              size="lg"
              className="w-full"
            >
              <Sparkles className="size-4" />
              Meilensteine generieren
            </Button>
            <button
              type="button"
              onClick={() => createSeriesWithMilestones([], "manual")}
              disabled={!canCreateManual}
              className="self-center text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              Oder leere Reihe erstellen
            </button>
          </div>
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
            }}
          >
            {focusedField && SERIES_HINTS[focusedField] ? (
              <>
                <p className="mb-2.5 text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-primary">
                  {SERIES_HINTS[focusedField].heading}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {SERIES_HINTS[focusedField].body}
                </p>
                {SERIES_HINTS[focusedField].example && (
                  <p className="mt-3 text-xs italic text-muted-foreground/60">
                    {SERIES_HINTS[focusedField].example}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mb-2.5 text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-muted-foreground/50">
                  Kontext
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground/70">
                  {classDisplayName} &middot; {subject} &middot; Klasse {grade}
                </p>
                <p className="mt-3 text-xs text-muted-foreground/50">
                  Klick in ein Feld für Hinweise.
                </p>
              </>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
