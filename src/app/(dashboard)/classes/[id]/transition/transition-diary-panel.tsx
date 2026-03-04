"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

type DiaryEntry = {
  id: string;
  entryDate: string | Date;
  plannedSummary: string | null;
  actualSummary: string | null;
  teacherNotes: string | null;
  progressStatus: string;
};

const statusLabels: Record<string, string> = {
  planned: "Geplant",
  completed: "Abgeschlossen",
  partial: "Teilweise",
  deviated: "Abgewichen",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  planned: "secondary",
  completed: "default",
  partial: "outline",
  deviated: "destructive",
};

interface Props {
  entries: DiaryEntry[];
  className?: string;
  label: string;
}

export function TransitionDiaryPanel({ entries, className, label }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const relevantEntries = entries.filter(
    (e) => e.progressStatus !== "planned"
  );

  return (
    <div className={`flex h-full flex-col ${className ?? ""}`}>
      <div className="shrink-0 pb-4">
        <h2 className="text-base font-semibold">Klassentagebuch</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {label} &middot; {relevantEntries.length}{" "}
          {relevantEntries.length === 1 ? "Eintrag" : "Einträge"} zum
          Nachschlagen
        </p>
        <div className="mt-3 border-b" />
      </div>

      {relevantEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-10 text-center mt-4">
          <FileText className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Keine abgeschlossenen Tagebucheinträge vorhanden.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pt-4">
          {relevantEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer py-3 px-4"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : entry.id)
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CardTitle className="shrink-0 text-sm font-medium">
                        {new Date(entry.entryDate).toLocaleDateString("de-DE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </CardTitle>
                      <Badge
                        variant={
                          statusVariant[entry.progressStatus] ?? "secondary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {statusLabels[entry.progressStatus] ??
                          entry.progressStatus}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  {entry.plannedSummary && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {entry.plannedSummary}
                    </p>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="flex flex-col gap-3 border-t px-4 pb-4 pt-3">
                    {entry.plannedSummary && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Geplant
                        </p>
                        <p className="text-sm">{entry.plannedSummary}</p>
                      </div>
                    )}
                    {entry.actualSummary && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Durchgeführt
                        </p>
                        <p className="text-sm">{entry.actualSummary}</p>
                      </div>
                    )}
                    {entry.teacherNotes && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Notizen
                        </p>
                        <p className="text-sm italic text-muted-foreground">
                          {entry.teacherNotes}
                        </p>
                      </div>
                    )}
                    {!entry.actualSummary && !entry.teacherNotes && (
                      <p className="text-sm text-muted-foreground">
                        Kein Inhalt erfasst.
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
