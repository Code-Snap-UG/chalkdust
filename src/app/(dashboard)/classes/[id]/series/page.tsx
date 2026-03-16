import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getClassGroup } from "@/lib/actions/class-groups";
import { getSeriesForClass } from "@/lib/actions/series";
import { notFound } from "next/navigation";
import { Plus, ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  completed: "Abgeschlossen",
};

export default async function SeriesListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classGroup, seriesList] = await Promise.all([
    getClassGroup(id),
    getSeriesForClass(id),
  ]);

  if (!classGroup) notFound();

  const isArchived = classGroup.status === "archived";

  return (
    <div className="flex flex-col gap-8 pb-6">

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/classes/${id}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            {classGroup.name}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Unterrichtsreihen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {classGroup.subject} &middot; Klasse {classGroup.grade}
          </p>
        </div>
        {!isArchived && (
          <Button asChild>
            <Link href={`/classes/${id}/series/new`}>
              <Plus className="size-4" />
              Reihe planen
            </Link>
          </Button>
        )}
      </div>

      {/* List or empty state */}
      {seriesList.length === 0 ? (
        <div className="py-16">
          <p className="font-display text-lg font-medium text-muted-foreground/60">
            Noch keine Unterrichtsreihen.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/50">
            Plane deine erste mehrstündige Einheit mit Meilensteinen.
          </p>
          {!isArchived && (
            <Button asChild className="mt-6">
              <Link href={`/classes/${id}/series/new`}>
                <Plus className="size-4" />
                Erste Reihe erstellen
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col border-t">
          {seriesList.map((s, i) => {
            const isActive = s.status === "active";
            const isCompleted = s.status === "completed";

            return (
              <Link
                key={s.id}
                href={`/classes/${id}/series/${s.id}`}
                className="-mx-1 group flex items-start gap-5 rounded-sm border-b px-1 py-5 transition-colors hover:bg-muted/40"
              >
                {/* Index — doubles as active indicator */}
                <span
                  className={cn(
                    "font-display shrink-0 pt-0.5 text-xl font-bold tabular-nums transition-colors",
                    isActive
                      ? "text-primary/70 group-hover:text-primary"
                      : "text-muted-foreground/20 group-hover:text-muted-foreground/35"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-semibold leading-snug">{s.title}</p>
                    <div className="flex shrink-0 items-baseline gap-3">
                      <span
                        className={cn(
                          "text-[0.65rem] font-semibold tracking-[0.1em] uppercase transition-colors",
                          isActive
                            ? "text-primary"
                            : isCompleted
                              ? "text-muted-foreground/50"
                              : "text-muted-foreground/40"
                        )}
                      >
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {s.estimatedLessons} Std.
                        {s.estimatedWeeks
                          ? ` · ~${s.estimatedWeeks} Wo.`
                          : ""}
                      </span>
                    </div>
                  </div>
                  {s.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                </div>

                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/70" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
