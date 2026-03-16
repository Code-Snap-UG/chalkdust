"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles,
  Upload,
  Loader2,
  Paperclip,
} from "lucide-react";

type DiaryEntry = {
  id: string;
  entryDate: string;
  plannedSummary: string | null;
  actualSummary: string | null;
  teacherNotes: string | null;
  progressStatus: string;
  lessonPlanId: string | null;
};

type MaterialItem = {
  id: string;
  title: string;
  type: string;
  source: string;
  fileUrl: string | null;
};

const statusLabels: Record<string, string> = {
  planned: "Geplant",
  completed: "Abgeschlossen",
  partial: "Teilweise",
  deviated: "Abgewichen",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planned: "secondary",
  completed: "default",
  partial: "outline",
  deviated: "destructive",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DiaryPage() {
  const params = useParams();
  const classGroupId = params.id as string;

  const { data, mutate } = useSWR<{ entries: DiaryEntry[]; isArchived: boolean }>(
    `/api/classes/${classGroupId}/diary`,
    fetcher
  );

  const entries = data?.entries ?? [];
  const isArchived = data?.isArchived ?? false;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<
    Record<string, { actualSummary: string; teacherNotes: string; progressStatus: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [entryMaterials, setEntryMaterials] = useState<
    Record<string, MaterialItem[]>
  >({});

  async function loadMaterials(entryId: string) {
    const res = await fetch(`/api/diary/${entryId}/materials`);
    if (res.ok) {
      const data = await res.json();
      setEntryMaterials((prev) => ({ ...prev, [entryId]: data.materials || [] }));
    }
  }

  function toggleExpand(entryId: string) {
    if (expandedId === entryId) {
      setExpandedId(null);
    } else {
      setExpandedId(entryId);
      const entry = entries.find((e) => e.id === entryId);
      if (entry) {
        setEditState((prev) => ({
          ...prev,
          [entryId]: {
            actualSummary: entry.actualSummary || "",
            teacherNotes: entry.teacherNotes || "",
            progressStatus: entry.progressStatus,
          },
        }));
        loadMaterials(entryId);
      }
    }
  }

  async function saveEntry(entryId: string) {
    const state = editState[entryId];
    if (!state) return;

    setSaving(entryId);
    try {
      await fetch(`/api/diary/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      await mutate();
    } finally {
      setSaving(null);
    }
  }

  async function handleFileUpload(
    entryId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(entryId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("diaryEntryId", entryId);
      formData.append("title", file.name);

      await fetch("/api/materials/upload", { method: "POST", body: formData });
      await loadMaterials(entryId);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Klassentagebuch</h2>
        <p className="text-muted-foreground">
          {entries.length} Einträge
          {isArchived
            ? " \u00b7 Archivierte Klasse \u2013 nur Lesezugriff"
            : " \u00b7 Klicke auf einen Eintrag, um ihn zu bearbeiten."}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="py-4 sm:py-8">
          <div className="max-w-lg">
            <span className="font-display text-6xl font-bold leading-none text-primary/10 sm:text-8xl">
              0
            </span>
            <h2 className="mt-4 text-xl font-bold sm:text-2xl">
              Noch keine Einträge.
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Das Klassentagebuch füllt sich automatisch — jede geplante Stunde
              erzeugt einen Eintrag. Nach dem Unterricht trägst du dort ein, was
              tatsächlich passiert ist.
            </p>
            {!isArchived && (
              <div className="mt-8">
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/classes/${classGroupId}/plan`}>
                    <Sparkles className="size-4" />
                    Erste Stunde planen
                  </Link>
                </Button>
              </div>
            )}

            <div className="mt-10 border-t pt-8">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                So funktioniert es
              </p>
              <div className="flex flex-col gap-4">
                {(
                  [
                    {
                      n: "1",
                      title: "Stunde planen",
                      desc: "Die KI erstellt einen vollständigen Unterrichtsplan — inkl. Phasen, Ziele und Materialien.",
                    },
                    {
                      n: "2",
                      title: "Eintrag erscheint automatisch",
                      desc: "Sobald der Plan gespeichert ist, taucht er hier als Tagebucheintrag auf.",
                    },
                    {
                      n: "3",
                      title: "Nach dem Unterricht nachhalten",
                      desc: "Trag ein, was tatsächlich passiert ist — so entsteht ein ehrliches Bild des Schuljahres.",
                    },
                  ] as const
                ).map((item) => (
                  <div key={item.n} className="flex items-start gap-4">
                    <span className="w-6 shrink-0 font-display text-2xl font-bold leading-none text-primary/30">
                      {item.n}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader
                className="cursor-pointer pb-3"
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-sm font-medium">
                      {new Date(entry.entryDate).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </CardTitle>
                    <Badge variant={statusVariant[entry.progressStatus] || "secondary"}>
                      {statusLabels[entry.progressStatus] ||
                        entry.progressStatus}
                    </Badge>
                  </div>
                  {expandedId === entry.id ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
                {entry.plannedSummary && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {entry.plannedSummary}
                  </p>
                )}
              </CardHeader>

              {expandedId === entry.id && (
                <CardContent className="flex flex-col gap-3 border-t pt-3">
                  {entry.plannedSummary && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Geplant
                      </p>
                      <p className="text-sm">{entry.plannedSummary}</p>
                    </div>
                  )}

                  {isArchived ? (
                    // Read-only view for archived classes
                    <>
                      {entry.actualSummary && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Durchgeführt
                          </p>
                          <p className="text-sm">{entry.actualSummary}</p>
                        </div>
                      )}
                      {entry.teacherNotes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Notizen
                          </p>
                          <p className="text-sm">{entry.teacherNotes}</p>
                        </div>
                      )}
                      {(entryMaterials[entry.id] || []).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Angehängte Materialien
                          </p>
                          {(entryMaterials[entry.id] || []).map((mat) => (
                            <div
                              key={mat.id}
                              className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm mb-1"
                            >
                              <Paperclip className="size-3 text-muted-foreground" />
                              <span>{mat.title}</span>
                              <Badge variant="secondary" className="text-xs ml-auto">
                                {mat.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // Editable view for active classes
                    <>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium">
                          Was wurde tatsächlich gemacht?
                        </label>
                        <textarea
                          value={editState[entry.id]?.actualSummary || ""}
                          onChange={(e) =>
                            setEditState((prev) => ({
                              ...prev,
                              [entry.id]: {
                                ...prev[entry.id],
                                actualSummary: e.target.value,
                              },
                            }))
                          }
                          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground"
                          placeholder="Beschreibe, was tatsächlich in der Stunde passiert ist..."
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium">Notizen</label>
                        <textarea
                          value={editState[entry.id]?.teacherNotes || ""}
                          onChange={(e) =>
                            setEditState((prev) => ({
                              ...prev,
                              [entry.id]: {
                                ...prev[entry.id],
                                teacherNotes: e.target.value,
                              },
                            }))
                          }
                          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground"
                          placeholder="Persönliche Notizen, Beobachtungen..."
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium">Status</label>
                        <select
                          value={editState[entry.id]?.progressStatus || "planned"}
                          onChange={(e) =>
                            setEditState((prev) => ({
                              ...prev,
                              [entry.id]: {
                                ...prev[entry.id],
                                progressStatus: e.target.value,
                              },
                            }))
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        >
                          <option value="planned">Geplant</option>
                          <option value="completed">Abgeschlossen</option>
                          <option value="partial">Teilweise erledigt</option>
                          <option value="deviated">Abgewichen</option>
                        </select>
                      </div>

                      {/* Materials */}
                      <div>
                        <p className="text-xs font-medium mb-2">
                          Angehängte Materialien
                        </p>
                        {(entryMaterials[entry.id] || []).map((mat) => (
                          <div
                            key={mat.id}
                            className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm mb-1"
                          >
                            <Paperclip className="size-3 text-muted-foreground" />
                            <span>{mat.title}</span>
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {mat.type}
                            </Badge>
                          </div>
                        ))}
                        <label className="mt-1 inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(entry.id, e)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            disabled={uploading === entry.id}
                          >
                            <span>
                              {uploading === entry.id ? (
                                <Loader2 className="mr-1 size-3 animate-spin" />
                              ) : (
                                <Upload className="mr-1 size-3" />
                              )}
                              Material hochladen
                            </span>
                          </Button>
                        </label>
                      </div>

                      <Button
                        onClick={() => saveEntry(entry.id)}
                        disabled={saving === entry.id}
                        size="sm"
                        className="w-fit"
                      >
                        {saving === entry.id ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : (
                          <Save className="mr-1 size-3" />
                        )}
                        Speichern
                      </Button>
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
