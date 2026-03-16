"use client";

import { useState, useTransition, Suspense } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Upload,
  Trash2,
  GripVertical,
  PenLine,
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

function NewClassWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Step 1 data — initialised from URL search params when navigating from the archive flow
  const [name, setName] = useState(() => searchParams.get("name") ?? "");
  const [grade, setGrade] = useState(() => searchParams.get("grade") ?? "");
  const [subject, setSubject] = useState(() => searchParams.get("subject") ?? "");
  const [schoolYear, setSchoolYear] = useState(() => searchParams.get("schoolYear") ?? "");
  const [predecessorId, setPredecessorId] = useState(() => searchParams.get("predecessorId") ?? "");

  const { data: archivedClasses = [] } = useSWR<ArchivedClass[]>(
    "/api/classes?status=archived",
    (url: string) => fetch(url).then((r) => r.json())
  );

  // Step 2 data
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

  function updateTopic(
    index: number,
    field: keyof ExtractedTopic,
    value: string
  ) {
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

  function moveTopic(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= topics.length) return;
    setTopics((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Neue Klasse anlegen
        </h1>
        <p className="text-muted-foreground">
          Schritt {step} von 3 &ndash;{" "}
          {step === 1
            ? "Klassendetails"
            : step === 2
              ? "Lehrplan hinzufügen"
              : curriculumMode === "manual"
                ? "Themen eingeben"
                : "Themen überprüfen"}
        </p>
      </div>

      {/* Step indicators */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Klassendetails</CardTitle>
            <CardDescription>
              Diese Informationen helfen dem KI-Assistenten, passende
              Unterrichtspläne zu erstellen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Klassenname</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. 5a"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade">Jahrgangsstufe</Label>
              <Input
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="z.B. 5"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Fach</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="z.B. Mathematik"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schoolYear">Schuljahr</Label>
              <Input
                id="schoolYear"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="z.B. 2025/2026"
                required
              />
            </div>
            {archivedClasses.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="predecessorId">
                  Vorjahresklasse verknüpfen{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <select
                  id="predecessorId"
                  value={predecessorId}
                  onChange={(e) => setPredecessorId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Keine Verknüpfung</option>
                  {archivedClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} – {cls.subject}, Klasse {cls.grade} (
                      {cls.schoolYear})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Die Übergangsdokumentation der Vorjahresklasse wird in die
                  KI-Unterrichtsplanung eingebunden.
                </p>
              </div>
            )}
            <Button
              onClick={() => setStep(2)}
              disabled={!name || !grade || !subject || !schoolYear}
              className="mt-2"
            >
              Weiter
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Lehrplan hinzufügen</CardTitle>
            <CardDescription>
              Wie möchtest du den Lehrplan für diese Klasse hinterlegen?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isPending ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  PDF wird analysiert und Themen werden extrahiert…
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {/* Option 1: PDF upload */}
                <label className="group flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-muted/30">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                    <Upload className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">PDF hochladen</p>
                    <p className="text-xs text-muted-foreground">
                      Die KI liest den Lehrplan und extrahiert automatisch Themen und Kompetenzbereiche. Max. 10 MB.
                    </p>
                  </div>
                </label>

                {/* Option 2: Manual entry */}
                <button
                  type="button"
                  onClick={handleManualCreate}
                  className="group flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                    <PenLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Manuell erstellen</p>
                    <p className="text-xs text-muted-foreground">
                      Themen und Kompetenzbereiche direkt selbst eingeben — ohne PDF.
                    </p>
                  </div>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                <ArrowLeft className="mr-2 size-4" />
                Zurück
              </Button>
              <Button variant="ghost" onClick={() => handleFinish()} disabled={isPending} className="text-muted-foreground">
                Ohne Lehrplan fortfahren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {curriculumMode === "manual" ? "Lehrplan manuell anlegen" : "Extrahierte Themen überprüfen"}
            </CardTitle>
            <CardDescription>
              {curriculumMode === "manual"
                ? "Füge die Themen und Kompetenzbereiche deines Lehrplans ein. Du kannst jederzeit weitere ergänzen."
                : `Die KI hat ${topics.length} Themen aus dem Lehrplan extrahiert. Du kannst sie bearbeiten, umsortieren oder ergänzen.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topics.map((topic, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border p-3"
              >
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => moveTopic(i, "up")}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
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
                    onChange={(e) =>
                      updateTopic(i, "description", e.target.value)
                    }
                    placeholder="Beschreibung (optional)"
                    className="text-sm"
                  />
                  <Input
                    value={topic.competencyArea}
                    onChange={(e) =>
                      updateTopic(i, "competencyArea", e.target.value)
                    }
                    placeholder="Kompetenzbereich (optional)"
                    className="text-xs"
                  />
                </div>
                <button
                  onClick={() => removeTopic(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <Button variant="outline" onClick={addTopic} className="w-full">
              + Thema hinzufügen
            </Button>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 size-4" />
                Zurück
              </Button>
              <Button
                onClick={handleFinish}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Check className="mr-2 size-4" />
                )}
                Klasse erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
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
