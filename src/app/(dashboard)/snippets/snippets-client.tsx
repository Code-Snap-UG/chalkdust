"use client";

import { useState, useCallback } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { lessonSnippets, classGroups } from "@/lib/db/schema";

type Snippet = typeof lessonSnippets.$inferSelect;
type ClassGroup = typeof classGroups.$inferSelect;

type Props = {
  snippets: Snippet[];
  classGroupId?: string;
  favoritedIds: string[];
  activeClasses: ClassGroup[];
};

const PHASE_ORDER = ["Einstieg", "Erarbeitung", "Sicherung", "Abschluss"];

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
            className={cn(
              "size-4 transition-colors",
              starFilled
                ? "fill-primary text-primary"
                : "text-muted-foreground/40"
            )}
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
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      )}
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
      <div className="pt-8">
        <p className="font-display text-lg font-medium text-muted-foreground/60">
          Noch keine Bausteine gespeichert.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Öffne einen Unterrichtsplan und speichere eine Phase über das
          Lesezeichen-Symbol als Baustein.
        </p>
      </div>
    );
  }

  // Group filtered snippets by phase
  const phaseGroups = new Map<string, Snippet[]>();
  for (const snippet of filtered) {
    const phase = snippet.phase ?? "Sonstige";
    if (!phaseGroups.has(phase)) phaseGroups.set(phase, []);
    phaseGroups.get(phase)!.push(snippet);
  }

  const sortedPhases = Array.from(phaseGroups.keys()).sort((a, b) => {
    const ai = PHASE_ORDER.indexOf(a);
    const bi = PHASE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, "de");
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        {classGroupId && (
          <>
            <Button
              variant={showFavoritesOnly ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowFavoritesOnly(true)}
            >
              <Star className="mr-1.5 size-3" />
              Klassen-Favoriten
            </Button>
            <Button
              variant={!showFavoritesOnly ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowFavoritesOnly(false)}
            >
              Alle Bausteine
            </Button>
            {allTags.length > 0 && (
              <span className="mx-1 h-4 w-px bg-border" />
            )}
          </>
        )}

        {allTags.length > 0 && (
          <>
            {!classGroupId && (
              <span className="text-sm text-muted-foreground">Filter:</span>
            )}
            <Button
              variant={activeTags.length === 0 ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveTags([])}
            >
              Alle
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={activeTags.includes(tag) ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="pt-4">
          <p className="font-display text-lg font-medium text-muted-foreground/60">
            Keine Bausteine gefunden.
          </p>
          {showFavoritesOnly && classGroupId && (
            <p className="mt-1 text-sm text-muted-foreground">
              Noch keine Bausteine für diese Klasse gemerkt.{" "}
              <button
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => setShowFavoritesOnly(false)}
              >
                Alle Bausteine anzeigen
              </button>{" "}
              und mit dem Stern markieren.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sortedPhases.map((phase) => {
            const group = phaseGroups.get(phase)!;
            return (
              <section key={phase} className="border-t pt-5">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                    {phase}
                  </p>
                  <span className="text-xs tabular-nums text-muted-foreground/50">
                    {group.length}
                  </span>
                </div>

                <ul>
                  {group.map((snippet) => {
                    const tags = (snippet.tags as string[]) ?? [];
                    const isFav = localFavorites.has(snippet.id);
                    const isToggling = togglingIds.has(snippet.id);

                    const meta = [
                      snippet.method,
                      snippet.durationMinutes != null
                        ? `${snippet.durationMinutes} Min.`
                        : null,
                      ...tags,
                    ].filter(Boolean);

                    return (
                      <li
                        key={snippet.id}
                        className="group flex items-start gap-3 border-b py-3.5 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">
                            {snippet.title}
                          </p>
                          {snippet.description && (
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {snippet.description}
                            </p>
                          )}
                          {meta.length > 0 && (
                            <p className="mt-1.5 text-xs text-muted-foreground/60">
                              {meta.join(" · ")}
                            </p>
                          )}
                          {snippet.notes && (
                            <p className="mt-1 text-xs italic text-muted-foreground/50">
                              {snippet.notes}
                            </p>
                          )}
                        </div>

                        {/* Star toggle */}
                        <div className="mt-0.5 shrink-0">
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
                                  className={cn(
                                    "size-4 transition-colors",
                                    isFav
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground/30 group-hover:text-muted-foreground/60"
                                  )}
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
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
