"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Archive, Sparkles, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { saveTransitionSummary, archiveClassGroup } from "@/lib/actions/class-groups";

type Step = "idle" | "generating" | "editing" | "confirming" | "saving" | "done";

interface Props {
  classGroupId: string;
  name: string;
  grade: string;
  subject: string;
  schoolYear: string;
  isArchived?: boolean;
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

export function CloseYearButton({ classGroupId, name, grade, subject, schoolYear, isArchived }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const isOpen = step !== "idle";

  async function handleOpen() {
    setStep("generating");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/classes/${classGroupId}/transition`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(
          data.error ?? "Die KI-Generierung ist fehlgeschlagen. Du kannst die Felder auch manuell ausfüllen."
        );
        setSummary("");
        setStrengths("");
        setWeaknesses("");
        setStep("editing");
        return;
      }

      const data = await res.json();
      setSummary(data.summary ?? "");
      setStrengths(data.strengths ?? "");
      setWeaknesses(data.weaknesses ?? "");
      setStep("editing");
    } catch {
      setErrorMessage(
        "Die KI-Generierung ist fehlgeschlagen. Du kannst die Felder auch manuell ausfüllen."
      );
      setSummary("");
      setStrengths("");
      setWeaknesses("");
      setStep("editing");
    }
  }

  async function handleArchive() {
    setStep("saving");
    setErrorMessage(null);

    try {
      await saveTransitionSummary(classGroupId, {
        summary,
        strengths,
        weaknesses,
      });
      await archiveClassGroup(classGroupId);
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

  function handleClose() {
    if (step === "saving") return;
    if (step === "done") { router.push("/classes"); router.refresh(); return; }
    setStep("idle");
    setErrorMessage(null);
    setSummary("");
    setStrengths("");
    setWeaknesses("");
  }

  return (
    <>
      {!isArchived && (
        <Button variant="outline" onClick={handleOpen}>
          <Archive className="mr-2 size-4" />
          Schuljahr abschließen
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">

          {/* Step: generating */}
          {step === "generating" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
              <div>
                <p className="font-medium">KI erstellt Übergangsdokumentation…</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Die KI analysiert das Klassentagebuch und erstellt eine strukturierte Jahresrückschau.
                </p>
              </div>
            </div>
          )}

          {/* Step: editing */}
          {step === "editing" && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  <DialogTitle>Übergangsdokumentation</DialogTitle>
                </div>
                <DialogDescription>
                  Überprüfe und bearbeite die KI-generierten Texte. Diese Dokumentation wird beim Archivieren gespeichert und steht der Folgelehrperson für die Unterrichtsplanung zur Verfügung.
                </DialogDescription>
              </DialogHeader>

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
                <Button variant="outline" onClick={handleClose}>
                  Abbrechen
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
              <DialogHeader>
                <DialogTitle>Klasse wirklich archivieren?</DialogTitle>
                <DialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </DialogDescription>
              </DialogHeader>

              <p className="text-sm text-muted-foreground">
                Die Klasse wird als abgeschlossen markiert. Alle Daten bleiben erhalten und sind weiterhin lesbar, können aber nicht mehr bearbeitet werden.
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
            <div className="flex flex-col items-center gap-4 py-8 text-center">
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
          {step === "done" && (() => {
            const newGrade = bumpGrade(grade);
            const newName = bumpName(name, grade, newGrade);
            const newSchoolYear = bumpSchoolYear(schoolYear);
            const params = new URLSearchParams({
              name: newName,
              grade: newGrade,
              subject,
              schoolYear: newSchoolYear,
              predecessorId: classGroupId,
            });
            const successorUrl = `/classes/new?${params.toString()}`;
            return (
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Klasse erfolgreich archiviert</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Die Übergangsdokumentation wurde gespeichert und steht für die Nachfolgeklasse bereit.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button
                    variant="outline"
                    onClick={() => { router.push("/classes"); router.refresh(); }}
                  >
                    Zur Klassenliste
                  </Button>
                  <Button onClick={() => router.push(successorUrl)}>
                    <ArrowRight className="mr-2 size-4" />
                    Nachfolgeklasse anlegen
                  </Button>
                </div>
              </div>
            );
          })()}

        </DialogContent>
      </Dialog>
    </>
  );
}
