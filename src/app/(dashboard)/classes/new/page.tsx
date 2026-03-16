"use client";

import { useState, useTransition, Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Upload,
  Trash2,
  PenLine,
  Plus,
} from "lucide-react";

type ArchivedClass = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  schoolYear: string;
};

type ExtractedTopic = {
  title: string;
  description: string;
  competencyArea: string;
};

const STEP_LABELS = [
  "Klassendetails",
  "Lehrplan",
  "Themen",
];

function NewClassWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(() => searchParams.get("name") ?? "");
  const [grade, setGrade] = useState(() => searchParams.get("grade") ?? "");
  const [subject, setSubject] = useState(() => searchParams.get("subject") ?? "");
  const [schoolYear, setSchoolYear] = useState(() => searchParams.get("schoolYear") ?? "");
  const [predecessorId, setPredecessorId] = useState(() => searchParams.get("predecessorId") ?? "");

  const { data: archivedClasses = [] } = useSWR<ArchivedClass[]>(
    "/api/classes?status=archived",
    (url: string) => fetch(url).then((r) => r.json())
  );

  const [curriculumMode, setCurriculumMode] = useState<"pdf" | "manual" | null>(null);
  const [fileName, setFileName] = useState("");
  const [topics, setTopics] = useState<ExtractedTopic[]>([]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("grade", grade);
        formData.append("subject", subject);

        const res = await fetch("/api/curriculum/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Fehler beim Hochladen");
          return;
        }

        const data = await res.json();
        setFileName(data.fileName);
        setTopics(data.topics);
        setStep(3);
      } catch {
        alert("Fehler beim Hochladen der Datei.");
      }
    });
  }

  function updateTopic(index: number, field: keyof ExtractedTopic, value: string) {
    setTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  function removeTopic(index: number) {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }

  function addTopic() {
    setTopics((prev) => [
      ...prev,
      { title: "", description: "", competencyArea: "" },
    ]);
  }

  function handleManualCreate() {
    setCurriculumMode("manual");
    setTopics([{ title: "", description: "", competencyArea: "" }]);
    setStep(3);
  }

  function handleFinish() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            grade,
            subject,
            schoolYear,
            predecessorId: predecessorId || undefined,
            curriculum: {
              subject,
              grade,
              sourceFileName: fileName,
              topics,
            },
          }),
        });

        if (!res.ok) {
          alert("Fehler beim Erstellen der Klasse.");
          return;
        }

        const data = await res.json();
        router.push(`/classes/${data.id}`);
      } catch {
        alert("Fehler beim Erstellen der Klasse.");
      }
    });
  }

  const stepThreeLabel = curriculumMode === "manual"
    ? "Themen eingeben"
    : "Themen prüfen";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back link */}
      {step === 1 ? (
        <Link
          href="/classes"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground w-fit"
        >
          <ArrowLeft className="size-3.5" />
          Klassen
        </Link>
      ) : (
        <button
          onClick={() => setStep(step - 1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground w-fit"
          disabled={isPending}
        >
          <ArrowLeft className="size-3.5" />
          {STEP_LABELS[step - 2]}
        </button>
      )}

      {/* Heading + step label */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Neue Klasse anlegen</h1>
        <p className="mt-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Schritt {step} von 3 &middot;{" "}
          {step === 1
            ? STEP_LABELS[0]
            : step === 2
              ? STEP_LABELS[1]
              : stepThreeLabel}
        </p>
      </div>

      {/* Progress bars */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Klassendetails ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Klassenname
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. 5a"
              className="h-11 text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="grade"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Jahrgangsstufe
            </label>
            <Input
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="z.B. 5"
              className="h-11 text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="subject"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Fach
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z.B. Mathematik"
              className="h-11 text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="schoolYear"
              className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
            >
              Schuljahr
            </label>
            <Input
              id="schoolYear"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              placeholder="z.B. 2025/2026"
              className="h-11 text-base"
            />
          </div>

          {archivedClasses.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="predecessorId"
                className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
              >
                Vorjahresklasse{" "}
                <span className="normal-case font-normal tracking-normal text-muted-foreground/60">
                  (optional)
                </span>
              </label>
              <select
                id="predecessorId"
                value={predecessorId}
                onChange={(e) => setPredecessorId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Keine Verknüpfung</option>
                {archivedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} – {cls.subject}, Klasse {cls.grade} ({cls.schoolYear})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Die Übergangsdokumentation der Vorjahresklasse wird in die
                KI-Unterrichtsplanung eingebunden.
              </p>
            </div>
          )}

          <div className="mt-2">
            <Button
              onClick={() => setStep(2)}
              disabled={!name || !grade || !subject || !schoolYear}
              size="lg"
            >
              Weiter
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Lehrplan ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          {isPending ? (
            <div className="flex items-center gap-3 border-l-2 border-primary/40 pl-3 py-2">
              <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                PDF wird analysiert — Themen werden extrahiert…
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 border-t sm:grid-cols-2">
              {/* Option 1: PDF upload */}
              <label className="group -mx-1 flex cursor-pointer flex-col gap-1 rounded-sm border-b px-1 py-5 transition-colors hover:bg-muted/40">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <p className="font-display text-lg font-bold leading-tight transition-colors group-hover:text-primary">
                  PDF hochladen
                </p>
                <p className="text-xs text-muted-foreground">
                  Die KI liest den Lehrplan und extrahiert automatisch Themen und
                  Kompetenzbereiche. Max. 10 MB.
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted-foreground/50">
                  <Upload className="size-3" />
                  .pdf
                </p>
              </label>

              {/* Option 2: Manual entry */}
              <button
                type="button"
                onClick={handleManualCreate}
                className="group -mx-1 flex flex-col gap-1 rounded-sm border-b px-1 py-5 text-left transition-colors hover:bg-muted/40"
              >
                <p className="font-display text-lg font-bold leading-tight transition-colors group-hover:text-primary">
                  Manuell erstellen
                </p>
                <p className="text-xs text-muted-foreground">
                  Themen und Kompetenzbereiche direkt selbst eingeben — ohne PDF.
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted-foreground/50">
                  <PenLine className="size-3" />
                  Freitext
                </p>
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFinish()}
              disabled={isPending}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              Ohne Lehrplan fortfahren →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Themen ── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {curriculumMode === "manual"
              ? "Füge die Themen deines Lehrplans ein. Du kannst jederzeit weitere ergänzen."
              : `Die KI hat ${topics.length} ${topics.length === 1 ? "Thema" : "Themen"} extrahiert. Prüfe und ergänze nach Bedarf.`}
          </p>

          <div className="border-t">
            {topics.map((topic, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b py-4"
              >
                {/* Index */}
                <span className="mt-2 w-6 shrink-0 font-display text-sm font-bold tabular-nums text-muted-foreground/30">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Fields */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <Input
                    value={topic.title}
                    onChange={(e) => updateTopic(i, "title", e.target.value)}
                    placeholder="Thema"
                    className="h-9 font-medium"
                  />
                  <Input
                    value={topic.description}
                    onChange={(e) => updateTopic(i, "description", e.target.value)}
                    placeholder="Beschreibung (optional)"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={topic.competencyArea}
                    onChange={(e) => updateTopic(i, "competencyArea", e.target.value)}
                    placeholder="Kompetenzbereich (optional)"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeTopic(i)}
                  className="mt-2 shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive"
                  title="Thema entfernen"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={addTopic}
            className="self-start text-muted-foreground hover:text-foreground"
          >
            <Plus className="mr-1.5 size-4" />
            Thema hinzufügen
          </Button>

          <div className="mt-2">
            <Button
              onClick={handleFinish}
              disabled={isPending}
              size="lg"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Klasse erstellen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewClassPage() {
  return (
    <Suspense>
      <NewClassWizard />
    </Suspense>
  );
}
