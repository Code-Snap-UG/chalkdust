import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClassGroup } from "@/lib/actions/class-groups";
import { getCurriculumTopics } from "@/lib/actions/curriculum";
import { getDiaryEntries } from "@/lib/actions/diary";
import { getLessonPlans } from "@/lib/actions/lesson-plans";
import { getClassFavorites } from "@/lib/actions/snippets";
import { getSeriesForClass } from "@/lib/actions/series";
import { notFound } from "next/navigation";
import { ChevronRight, Layers, PencilLine, Sparkles } from "lucide-react";
import { CloseYearButton } from "./close-year-button";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [classGroup, topics, diaryEntries, lessonPlans, snippetFavorites, seriesList] =
    await Promise.all([
      getClassGroup(id),
      getCurriculumTopics(id),
      getDiaryEntries(id),
      getLessonPlans(id),
      getClassFavorites(id),
      getSeriesForClass(id),
    ]);

  if (!classGroup) notFound();

  const completedEntries: typeof diaryEntries = [];
  const plannedEntries: typeof diaryEntries = [];
  const taughtEntries: typeof diaryEntries = [];
  for (const e of diaryEntries) {
    if (e.progressStatus === "planned") {
      plannedEntries.push(e);
    } else {
      taughtEntries.push(e);
      if (e.progressStatus === "completed") completedEntries.push(e);
    }
  }
  const totalHours = lessonPlans.reduce(
    (sum, p) => sum + (p.durationMinutes || 0),
    0
  );
  const topicsCovered = completedEntries.length;
  const isArchived = classGroup.status === "archived";

  const quickLinks = [
    ...(!isArchived
      ? [
          {
            href: `/classes/${id}/plan`,
            label: "Stunde planen",
            description: "Neuen Unterrichtsplan mit KI erstellen",
          },
          {
            href: `/classes/${id}/series`,
            label: "Reihenplanung",
            description:
              seriesList.length > 0
                ? `${seriesList.length} ${seriesList.length === 1 ? "Reihe" : "Reihen"} aktiv`
                : "Mehrstündige Einheiten planen",
          },
        ]
      : []),
    {
      href: `/classes/${id}/diary`,
      label: "Klassentagebuch",
      description: `${diaryEntries.length} Einträge`,
    },
    {
      href: `/classes/${id}/curriculum`,
      label: "Lehrplan",
      description: `${topics.length} Themen`,
    },
  ];

  return (
    <div className="flex flex-col gap-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {classGroup.name} &ndash; {classGroup.subject}
            </h1>
            {isArchived && (
              <Badge variant="secondary" className="text-xs">
                Archiviert
              </Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            Klasse {classGroup.grade} &middot; Schuljahr {classGroup.schoolYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CloseYearButton classGroupId={id} isArchived={isArchived} />
          {!isArchived && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/classes/${id}/plan/blank`}>
                  <PencilLine className="mr-2 size-4" />
                  Manuell
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/classes/${id}/plan`}>
                  <Sparkles className="mr-2 size-4" />
                  Stunde planen
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lehrplan progress bar */}
      {topics.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lehrplanfortschritt</span>
            <span className="font-medium">
              {topicsCovered} von {topics.length} Themen
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted">
            <div
              className="h-1 rounded-full bg-primary transition-all"
              style={{
                width: `${topics.length > 0 ? (topicsCovered / topics.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stats — no borders, spacing only */}
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <span className="font-display text-3xl font-bold leading-none">
            {lessonPlans.length}
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">Stunden geplant</p>
        </div>
        <div>
          <span className="font-display text-3xl font-bold leading-none">
            {completedEntries.length}
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">Abgeschlossen</p>
        </div>
        <div>
          <span className="font-display text-3xl font-bold leading-none">
            {topics.length - topicsCovered}
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">Themen offen</p>
        </div>
        <div>
          <span className="font-display text-3xl font-bold leading-none">
            {Math.round(totalHours / 60)}
            <span className="text-xl text-muted-foreground">h</span>
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">Unterrichtszeit</p>
        </div>
      </div>

      {/* Quick links — nav rows with clear affordance */}
      <div className="flex flex-col border-t">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 border-b py-3.5 transition-colors hover:bg-muted/40 -mx-1 px-1 rounded-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{link.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{link.description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Transition summary (archived classes only) */}
      {isArchived &&
        (classGroup.transitionSummary ||
          classGroup.transitionStrengths ||
          classGroup.transitionWeaknesses) && (
          <div className="flex flex-col gap-4 rounded-sm border bg-muted/30 p-5">
            <h3 className="font-semibold">Übergangsdokumentation</h3>
            {classGroup.transitionSummary && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Jahresrückschau
                </p>
                <p className="text-sm leading-relaxed">{classGroup.transitionSummary}</p>
              </div>
            )}
            {classGroup.transitionStrengths && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Stärken
                </p>
                <p className="text-sm leading-relaxed">{classGroup.transitionStrengths}</p>
              </div>
            )}
            {classGroup.transitionWeaknesses && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Förderbedarf
                </p>
                <p className="text-sm leading-relaxed">{classGroup.transitionWeaknesses}</p>
              </div>
            )}
          </div>
        )}

      {/* Unterrichtsreihen — clean list, no outer border, no icon squares */}
      {seriesList.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unterrichtsreihen
            </h3>
            <Link
              href={`/classes/${id}/series`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Alle →
            </Link>
          </div>
          <div className="flex flex-col border-t">
            {seriesList.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                href={`/classes/${id}/series/${s.id}`}
                className="group flex items-center gap-3 border-b py-3.5 -mx-1 px-1 rounded-sm transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.estimatedLessons} Stunden
                    {s.estimatedWeeks ? ` · ~${s.estimatedWeeks} Wochen` : ""}
                  </p>
                </div>
                <Badge
                  variant={
                    s.status === "active"
                      ? "default"
                      : s.status === "completed"
                        ? "secondary"
                        : "outline"
                  }
                  className="shrink-0 text-xs"
                >
                  {s.status === "active"
                    ? "Aktiv"
                    : s.status === "completed"
                      ? "Fertig"
                      : "Entwurf"}
                </Badge>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bausteine — only show when populated */}
      {snippetFavorites.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bausteine
            </h3>
            <Link
              href={`/snippets?classGroupId=${id}`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Alle →
            </Link>
          </div>
          <div className="flex flex-col border-t">
            {snippetFavorites.slice(0, 5).map((snippet) => (
              <div
                key={snippet.id}
                className="flex items-baseline justify-between border-b py-3"
              >
                <p className="text-sm font-medium line-clamp-1">{snippet.title}</p>
                <p className="ml-4 shrink-0 text-xs text-muted-foreground">
                  {snippet.phase}
                  {snippet.durationMinutes != null
                    ? ` · ${snippet.durationMinutes} Min.`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anstehende Stunden */}
      {plannedEntries.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Anstehend
            </h3>
            <Link
              href={`/classes/${id}/diary`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Alle →
            </Link>
          </div>
          <div className="flex flex-col border-t">
            {plannedEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-baseline gap-4 border-b py-3"
              >
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {new Date(entry.entryDate).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <p className="min-w-0 text-sm line-clamp-1 ">
                  {entry.plannedSummary || "Kein Titel"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letzte Stunden — date + summary rows, no outer border */}
      {taughtEntries.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Letzte Stunden
            </h3>
            <Link
              href={`/classes/${id}/diary`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Alle →
            </Link>
          </div>
          <div className="flex flex-col border-t">
            {taughtEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-baseline gap-4 border-b py-3"
              >
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {new Date(entry.entryDate).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <p className="min-w-0 line-clamp-1 text-sm text-muted-foreground">
                  {entry.actualSummary ||
                    entry.plannedSummary ||
                    "Kein Eintrag"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
