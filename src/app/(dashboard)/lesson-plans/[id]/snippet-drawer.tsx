"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TimelinePhase } from "@/lib/ai/schemas";
import type { lessonSnippets } from "@/lib/db/schema";

type LessonSnippet = typeof lessonSnippets.$inferSelect;

const PHASE_FILTERS = [
  "Alle",
  "Einstieg",
  "Erarbeitung",
  "Sicherung",
  "Abschluss",
] as const;

function snippetToPhase(snippet: LessonSnippet): TimelinePhase {
  return {
    phase: snippet.phase,
    durationMinutes: snippet.durationMinutes ?? 10,
    description: snippet.description,
    method: snippet.method ?? "Unterrichtsgespräch",
  };
}

type SnippetDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (phase: TimelinePhase) => void;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SnippetDrawer({
  open,
  onOpenChange,
  onInsert,
}: SnippetDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("Alle");

  const { data: snippets = [], isLoading } = useSWR<LessonSnippet[]>(
    open ? "/api/snippets" : null,
    fetcher
  );

  const filtered = snippets.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);
    const matchesPhase =
      phaseFilter === "Alle" || s.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-80 flex-col gap-0 p-0 sm:max-w-80">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base">Snippets</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="border-b px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Phase filter */}
        <div className="flex flex-wrap gap-1.5 border-b px-4 py-3">
          {PHASE_FILTERS.map((f) => (
            <Button
              key={f}
              variant={phaseFilter === f ? "default" : "outline"}
              size="sm"
              className="h-6 rounded-full px-2.5 text-xs"
              onClick={() => setPhaseFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Snippet list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {snippets.length === 0
                ? "Noch keine Snippets gespeichert."
                : "Keine Snippets gefunden."}
            </p>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col gap-3">
              {filtered.map((snippet) => (
                <div
                  key={snippet.id}
                  className="rounded-lg border p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm leading-tight">
                      {snippet.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {snippet.phase}
                    </Badge>
                    {snippet.method && (
                      <Badge variant="outline" className="text-xs">
                        {snippet.method}
                      </Badge>
                    )}
                    {snippet.durationMinutes != null && (
                      <span className="text-xs text-muted-foreground">
                        {snippet.durationMinutes} Min.
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {snippet.description}
                  </p>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 self-end text-xs"
                    onClick={() => onInsert(snippetToPhase(snippet))}
                  >
                    Einfügen ↓
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
