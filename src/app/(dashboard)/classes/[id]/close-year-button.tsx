"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Archive, Sparkles, AlertTriangle } from "lucide-react";
import { saveTransitionSummary, archiveClassGroup } from "@/lib/actions/class-groups";

type Step = "idle" | "generating" | "editing" | "saving" | "error";

interface Props {
  classGroupId: string;
}

export function CloseYearButton({ classGroupId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");

  async function handleGenerate() {
    setStep("generating");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/classes/${classGroupId}/transition`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Degradation: show empty form so teacher can write manually
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
      router.push("/classes");
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Beim Archivieren ist ein Fehler aufgetreten."
      );
      setStep("editing");
    }
  }

  function handleCancel() {
    setStep("idle");
    setErrorMessage(null);
    setSummary("");
    setStrengths("");
    setWeaknesses("");
  }

  if (step === "idle") {
    return (
      <Button variant="outline" onClick={handleGenerate}>
        <Archive className="mr-2 size-4" />
        Schuljahr abschließen
      </Button>
    );
  }

  if (step === "generating") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="font-medium">KI erstellt Übergangsdokumentation…</p>
            <p className="text-sm text-muted-foreground">
              Die KI analysiert das Klassentagebuch und erstellt eine strukturierte Jahresrückschau.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "editing" || step === "saving") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="font-semibold">Übergangsdokumentation</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={step === "saving"}>
            Abbrechen
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Überprüfe und bearbeite die KI-generierten Texte. Diese Dokumentation wird beim Archivieren gespeichert und steht der Folgelehrperson für die Unterrichtsplanung zur Verfügung.
        </p>

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
              disabled={step === "saving"}
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
              disabled={step === "saving"}
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
              disabled={step === "saving"}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!summary.trim() || !strengths.trim() || !weaknesses.trim() || step === "saving"}
              >
                {step === "saving" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Archive className="mr-2 size-4" />
                )}
                Klasse archivieren
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Klasse wirklich archivieren?</AlertDialogTitle>
                <AlertDialogDescription>
                  Die Klasse wird als abgeschlossen markiert. Alle Daten bleiben erhalten und sind weiterhin lesbar, können aber nicht mehr bearbeitet werden. Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>
                  Klasse archivieren
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  return null;
}
