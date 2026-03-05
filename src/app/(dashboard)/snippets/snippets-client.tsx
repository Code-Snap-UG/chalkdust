"use client";

import { useState, useCallback } from "react";
import { Bookmark, Clock, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { lessonSnippets, classGroups } from "@/lib/db/schema";

type Snippet = typeof lessonSnippets.$inferSelect;
type ClassGroup = typeof classGroups.$inferSelect;

type Props = {
  snippets: Snippet[];
  classGroupId?: string;
  favoritedIds: string[];
  activeClasses: ClassGroup[];
};

// ─── Class picker popover (global view, no class context) ────────────────────

type ClassPickerProps = {
  snippetId: string;
  activeClasses: ClassGroup[];
  isFavoritedAnywhere: boolean;
};

function ClassPickerPopover({
  snippetId,
  activeClasses,
  isFavoritedAnywhere,
}: ClassPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string> | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && checkedIds === null) {
      setLoading(true);
      try {
        const res = await fetch(`/api/snippets/${snippetId}/favorites`);
        const data = (await res.json()) as { classGroupIds: string[] };
        setCheckedIds(new Set(data.classGroupIds));
      } catch {
        setCheckedIds(new Set());
      } finally {
        setLoading(false);
      }
    }
  }

  async function toggleClass(classGroupId: string) {
    if (!checkedIds || pending.has(classGroupId)) return;

    const isCurrentlyChecked = checkedIds.has(classGroupId);

    setPending((p) => new Set([...p, classGroupId]));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyChecked) next.delete(classGroupId);
      else next.add(classGroupId);
      return next;
    });

    try {
      if (isCurrentlyChecked) {
        await fetch(
          `/api/snippets/${snippetId}/favorites/${classGroupId}`,
          { method: "DELETE" }
        );
      } else {
        await fetch(`/api/snippets/${snippetId}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classGroupId }),
        });
      }
    } catch {
      // revert on error
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyChecked) next.add(classGroupId);
        else next.delete(classGroupId);
        return next;
      });
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(classGroupId);
        return next;
      });
    }
  }

  const hasFavorites = checkedIds && checkedIds.size > 0;
  const starFilled = isFavoritedAnywhere || (hasFavorites ?? false);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="rounded p-0.5 transition-colors hover:bg-muted"
          aria-label="Zur Klasse hinzufügen"
        >
          <Star
            className={`size-4 transition-colors ${
              starFilled
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <div className="border-b px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Zur Klasse hinzufügen
          </p>
        </div>
        {loading || checkedIds === null ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : activeClasses.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            Keine aktiven Klassen gefunden.
          </div>
        ) : (
          <ul className="py-1">
            {activeClasses.map((cls) => {
              const checked = checkedIds.has(cls.id);
              const isPending = pending.has(cls.id);
              return (
                <li key={cls.id}>
                  <button
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                    onClick={() => toggleClass(cls.id)}
                    disabled={isPending}
                  >
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {checked && (
                        <svg
                          viewBox="0 0 12 12"
                          className="size-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 truncate text-left">
                      {cls.name}
                      {cls.subject ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          – {cls.subject}
                        </span>
                      ) : null}
                    </span>
                    {isPending && (
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Main client component ───────────────────────────────────────────────────

export function SnippetsClient({
  snippets,
  classGroupId,
  favoritedIds,
  activeClasses,
}: Props) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(!!classGroupId);
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(
    () => new Set(favoritedIds)
  );
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const allTags = Array.from(
    new Set(snippets.flatMap((s) => (s.tags as string[]) ?? []))
  ).toSorted();

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const handleClassContextToggle = useCallback(
    async (snippetId: string) => {
      if (!classGroupId || togglingIds.has(snippetId)) return;

      const isFav = localFavorites.has(snippetId);

      setLocalFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(snippetId);
        else next.add(snippetId);
        return next;
      });
      setTogglingIds((prev) => new Set([...prev, snippetId]));

      try {
        if (isFav) {
          await fetch(
            `/api/snippets/${snippetId}/favorites/${classGroupId}`,
            { method: "DELETE" }
          );
        } else {
          await fetch(`/api/snippets/${snippetId}/favorites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classGroupId }),
          });
        }
      } catch {
        // revert
        setLocalFavorites((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(snippetId);
          else next.delete(snippetId);
          return next;
        });
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(snippetId);
          return next;
        });
      }
    },
    [classGroupId, localFavorites, togglingIds]
  );

  let filtered = snippets;

  if (classGroupId && showFavoritesOnly) {
    filtered = filtered.filter((s) => localFavorites.has(s.id));
  }

  if (activeTags.length > 0) {
    filtered = filtered.filter((s) =>
      activeTags.every((tag) => (s.tags as string[]).includes(tag))
    );
  }

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
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Class favorites toggle — only shown in class context */}
        {classGroupId && (
          <>
            <Button
              variant={showFavoritesOnly ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setShowFavoritesOnly(true)}
            >
              <Star className="mr-1.5 size-3" />
              Klassen-Favoriten
            </Button>
            <Button
              variant={!showFavoritesOnly ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setShowFavoritesOnly(false)}
            >
              Alle Bausteine
            </Button>
            {allTags.length > 0 && (
              <span className="mx-1 h-4 w-px bg-border" />
            )}
          </>
        )}

        {/* Tag filter */}
        {allTags.length > 0 && (
          <>
            {!classGroupId && (
              <span className="text-sm text-muted-foreground">Filter:</span>
            )}
            <Button
              variant={activeTags.length === 0 ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setActiveTags([])}
            >
              Alle Tags
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
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <Star className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {showFavoritesOnly && classGroupId
              ? 'Noch keine Bausteine für diese Klasse gemerkt. Wechsle zu "Alle Bausteine" und markiere welche mit dem Stern.'
              : "Keine Bausteine für diesen Filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((snippet) => {
            const tags = (snippet.tags as string[]) ?? [];
            const isFav = localFavorites.has(snippet.id);
            const isToggling = togglingIds.has(snippet.id);

            return (
              <Card key={snippet.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {snippet.phase}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {snippet.durationMinutes != null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {snippet.durationMinutes} Min.
                        </span>
                      )}
                      {/* Star — direct toggle in class context, popover in global view */}
                      {classGroupId ? (
                        <button
                          className="rounded p-0.5 transition-colors hover:bg-muted disabled:opacity-40"
                          onClick={() =>
                            handleClassContextToggle(snippet.id)
                          }
                          disabled={isToggling}
                          aria-label={
                            isFav
                              ? "Aus Klassen-Favoriten entfernen"
                              : "Zu Klassen-Favoriten hinzufügen"
                          }
                        >
                          {isToggling ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Star
                              className={`size-4 transition-colors ${
                                isFav
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          )}
                        </button>
                      ) : (
                        <ClassPickerPopover
                          snippetId={snippet.id}
                          activeClasses={activeClasses}
                          isFavoritedAnywhere={isFav}
                        />
                      )}
                    </div>
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
