"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Archive,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
type Step = "generating" | "editing" | "confirming" | "saving" | "done";

interface Props {
  classGroupId: string;
  name: string;
  grade: string;
  subject: string;
  schoolYear: string;
}

function bumpGrade(grade: string): string {
  const n = parseInt(grade, 10);
  return isNaN(n) ? grade : String(n + 1);
}

function bumpName(name: string, oldGrade: string, newGrade: string): string {
  if (!oldGrade || oldGrade === newGrade) return name;
  if (name.startsWith(oldGrade)) return newGrade + name.slice(oldGrade.length);
  return name;
}

function bumpSchoolYear(schoolYear: string): string {
  const match = schoolYear.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return schoolYear;
  return `${parseInt(match[1]) + 1}/${parseInt(match[2]) + 1}`;
}

export function TransitionWizard({
  classGroupId,
  name,
  grade,
  subject,
  schoolYear,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("generating");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const res = await fetch(`/api/classes/${classGroupId}/transition`, {
          method: "POST",
        });

        if (cancelled) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(
            data.error ??
              "Die KI-Generierung ist fehlgeschlagen. Du kannst die Felder auch manuell ausfüllen."
          );
          setSummary("");
          setStrengths("");
          setWeaknesses("");
          setStep("editing");
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setSummary(data.summary ?? "");
          setStrengths(data.strengths ?? "");
          setWeaknesses(data.weaknesses ?? "");
          setStep("editing");
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(
            "Die KI-Generierung ist fehlgeschlagen. Du kannst die Felder auch manuell ausfüllen."
          );
          setSummary("");
          setStrengths("");
          setWeaknesses("");
          setStep("editing");
        }
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [classGroupId]);

  async function handleArchive() {
    setStep("saving");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/classes/${classGroupId}/transition`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, strengths, weaknesses }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ?? "Beim Archivieren ist ein Fehler aufgetreten."
        );
      }

      setStep("done");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Beim Archivieren ist ein Fehler aufgetreten."
      );
      setStep("editing");
    }
  }

  const newGrade = bumpGrade(grade);
  const newName = bumpName(name, grade, newGrade);
  const newSchoolYear = bumpSchoolYear(schoolYear);
  const successorParams = new URLSearchParams({
    name: newName,
    grade: newGrade,
    subject,
    schoolYear: newSchoolYear,
    predecessorId: classGroupId,
  });
  const successorUrl = `/classes/new?${successorParams.toString()}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Step: generating */}
      {step === "generating" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="font-medium">KI erstellt Übergangsdokumentation…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Die KI analysiert das Klassentagebuch und erstellt eine strukturierte
              Jahresrückschau. Du kannst die Einträge links bereits einsehen.
            </p>
          </div>
        </div>
      )}

      {/* Step: editing */}
      {step === "editing" && (
        <>
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Übergangsdokumentation</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Überprüfe und bearbeite die KI-generierten Texte. Diese
                Dokumentation wird beim Archivieren gespeichert und steht der
                Folgelehrperson für die Unterrichtsplanung zur Verfügung.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="transition-summary">Jahresrückschau</Label>
              <Textarea
                id="transition-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ganzheitliche Beschreibung des Schuljahres: behandelte Themen, Klassenentwicklung, bewährte Unterrichtsformen…"
                rows={5}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transition-strengths">Stärken der Klasse</Label>
              <Textarea
                id="transition-strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Bereiche, in denen die Klasse besonders gut vorangekommen ist…"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transition-weaknesses">
                Förderbedarf und offene Themen
              </Label>
              <Textarea
                id="transition-weaknesses"
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                placeholder="Bereiche, die im nächsten Schuljahr besondere Aufmerksamkeit erfordern…"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href={`/classes/${classGroupId}`}>Abbrechen</Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setStep("confirming")}
              disabled={!summary.trim() || !strengths.trim() || !weaknesses.trim()}
            >
              <Archive className="mr-2 size-4" />
              Klasse archivieren
            </Button>
          </div>
        </>
      )}

      {/* Step: confirming */}
      {step === "confirming" && (
        <>
          <div>
            <p className="font-medium">Klasse wirklich archivieren?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Die Klasse wird als abgeschlossen markiert. Alle Daten bleiben
            erhalten und sind weiterhin lesbar, können aber nicht mehr bearbeitet
            werden.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep("editing")}>
              Zurück
            </Button>
            <Button variant="destructive" onClick={handleArchive}>
              <Archive className="mr-2 size-4" />
              Ja, archivieren
            </Button>
          </div>
        </>
      )}

      {/* Step: saving */}
      {step === "saving" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="font-medium">Klasse wird archiviert…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Die Dokumentation wird gespeichert.
            </p>
          </div>
        </div>
      )}

      {/* Step: done */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold">Klasse erfolgreich archiviert</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Die Übergangsdokumentation wurde gespeichert und steht für die
              Nachfolgeklasse bereit.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/classes");
                router.refresh();
              }}
            >
              Zur Klassenliste
            </Button>
            <Button onClick={() => router.push(successorUrl)}>
              <ArrowRight className="mr-2 size-4" />
              Nachfolgeklasse anlegen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
