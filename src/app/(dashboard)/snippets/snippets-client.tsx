"use client";

import { useState } from "react";
import { Bookmark, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { lessonSnippets } from "@/lib/db/schema";

type Snippet = typeof lessonSnippets.$inferSelect;

type Props = {
  snippets: Snippet[];
};

export function SnippetsClient({ snippets }: Props) {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = Array.from(
    new Set(snippets.flatMap((s) => (s.tags as string[]) ?? []))
  ).sort();

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const filtered =
    activeTags.length === 0
      ? snippets
      : snippets.filter((s) =>
          activeTags.every((tag) => (s.tags as string[]).includes(tag))
        );

  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Bookmark className="size-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Noch keine Bausteine</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Öffne einen Unterrichtsplan und speichere eine Phase über das{" "}
            <span className="inline-flex items-center gap-0.5 font-medium">
              <Bookmark className="inline size-3.5" />
            </span>
            -Symbol als Baustein.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            variant={activeTags.length === 0 ? "secondary" : "ghost"}
            size="sm"
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setActiveTags([])}
          >
            Alle
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={activeTags.includes(tag) ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Keine Bausteine für diesen Filter.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((snippet) => {
            const tags = (snippet.tags as string[]) ?? [];
            return (
              <Card key={snippet.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {snippet.phase}
                    </Badge>
                    {snippet.durationMinutes != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {snippet.durationMinutes} Min.
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-base leading-snug">
                    {snippet.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {snippet.description}
                  </p>

                  {snippet.method && (
                    <Badge
                      variant="outline"
                      className="w-fit text-xs font-normal"
                    >
                      {snippet.method}
                    </Badge>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {snippet.notes && (
                    <p className="text-xs italic text-muted-foreground">
                      {snippet.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
