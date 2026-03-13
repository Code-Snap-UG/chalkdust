import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClassGroup } from "@/lib/actions/class-groups";
import { getCurriculumTopics } from "@/lib/actions/curriculum";
import { getDiaryEntries } from "@/lib/actions/diary";
import { getLessonPlans } from "@/lib/actions/lesson-plans";
import { getClassFavorites } from "@/lib/actions/snippets";
import { getSeriesForClass } from "@/lib/actions/series";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Layers,
  PencilLine,
  Sparkles,
  Target,
  CheckCircle,
  Paperclip,
  MessageSquare,
  Star,
} from "lucide-react";
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

  // Single pass to partition diary entries into the three buckets needed below
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {classGroup.name} &ndash; {classGroup.subject}
            </h1>
            {isArchived && (
              <Badge variant="secondary" className="text-xs">
                Archiviert
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Klasse {classGroup.grade} &middot; Schuljahr{" "}
            {classGroup.schoolYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CloseYearButton
            classGroupId={id}
            isArchived={isArchived}
          />
          {!isArchived && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/classes/${id}/plan/blank`}>
                  <PencilLine className="mr-2 size-4" />
                  Manuell erstellen
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/classes/${id}/plan`}>
                  <Sparkles className="mr-2 size-4" />
                  Stunde planen
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Curriculum progress */}
      {topics.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lehrplanfortschritt</span>
            <span className="font-medium">
              {topicsCovered} von {topics.length} Themen
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${topics.length > 0 ? (topicsCovered / topics.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                <Calendar className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lessonPlans.length}</p>
                <p className="text-xs text-muted-foreground">Stunden geplant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10">
                <CheckCircle className="size-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedEntries.length}</p>
                <p className="text-xs text-muted-foreground">Abgeschlossen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-amber-500/10">
                <Target className="size-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {topics.length - topicsCovered}
                </p>
                <p className="text-xs text-muted-foreground">Themen offen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-blue-500/10">
                <Clock className="size-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(totalHours / 60)}h
                </p>
                <p className="text-xs text-muted-foreground">Unterrichtszeit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {!isArchived && (
          <>
            <Link href={`/classes/${id}/plan`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" />
                    Stunde planen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Erstelle mit KI-Unterstützung einen neuen Unterrichtsplan.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/classes/${id}/series`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Layers className="size-4 text-primary" />
                    Reihenplanung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {seriesList.length > 0
                      ? `${seriesList.length} ${seriesList.length === 1 ? "Reihe" : "Reihen"} · Mehrstündige Einheiten planen.`
                      : "Plane mehrstündige Unterrichtseinheiten mit Meilensteinen."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}

        <Link href={`/classes/${id}/diary`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="size-4 text-primary" />
                Klassentagebuch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {diaryEntries.length} Einträge &middot; Letzte Stunden einsehen.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/classes/${id}/curriculum`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="size-4 text-primary" />
                Kerncurriculum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {topics.length} Themen &middot; Fortschritt und Inhalte
                einsehen.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Active Reihen */}
      {seriesList.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Unterrichtsreihen</h3>
            <Link
              href={`/classes/${id}/series`}
              className="text-xs text-primary hover:underline"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {seriesList.slice(0, 3).map((s) => (
              <Link key={s.id} href={`/classes/${id}/series/${s.id}`}>
                <div className="flex items-center gap-3 rounded-lg border p-3 transition-shadow hover:shadow-sm">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Layers className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1">
                      {s.title}
                    </p>
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
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Snippet favorites */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Bausteine</h3>
          <Link
            href={`/snippets?classGroupId=${id}`}
            className="text-xs text-primary hover:underline"
          >
            Alle anzeigen →
          </Link>
        </div>
        {snippetFavorites.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 p-6 text-center">
            <Star className="size-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Noch keine Bausteine für diese Klasse.{" "}
              <Link
                href={`/snippets?classGroupId=${id}`}
                className="text-primary hover:underline"
              >
                Zur Bibliothek
              </Link>{" "}
              und Bausteine mit dem Stern markieren.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {snippetFavorites.slice(0, 6).map((snippet) => (
              <div
                key={snippet.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {snippet.phase}
                    </Badge>
                    {snippet.durationMinutes != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="size-3" />
                        {snippet.durationMinutes} Min.
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium line-clamp-1">
                    {snippet.title}
                  </p>
                  {snippet.method && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {snippet.method}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transition summary (archived classes only) */}
      {isArchived &&
        (classGroup.transitionSummary ||
          classGroup.transitionStrengths ||
          classGroup.transitionWeaknesses) && (
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-5">
            <h3 className="font-semibold">Übergangsdokumentation</h3>
            {classGroup.transitionSummary && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Jahresrückschau
                </p>
                <p className="text-sm">{classGroup.transitionSummary}</p>
              </div>
            )}
            {classGroup.transitionStrengths && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Stärken
                </p>
                <p className="text-sm">{classGroup.transitionStrengths}</p>
              </div>
            )}
            {classGroup.transitionWeaknesses && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Förderbedarf
                </p>
                <p className="text-sm">{classGroup.transitionWeaknesses}</p>
              </div>
            )}
          </div>
        )}

      {/* Upcoming planned lessons */}
      {plannedEntries.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold">Anstehende Stunden</h3>
          <div className="flex flex-col gap-2">
            {plannedEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {new Date(entry.entryDate).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
                <p className="flex-1 text-sm line-clamp-1">
                  {entry.plannedSummary || "Kein Titel"}
                </p>
                {entry.lessonPlanId && (
                  <Link
                    href={`/lesson-plans/${entry.lessonPlanId}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Plan ansehen
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent diary timeline */}
      {diaryEntries.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold">
            Letzte Stunden
          </h3>
          <div className="flex flex-col gap-2">
            {taughtEntries
              .slice(0, 10)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Badge
                    variant={
                      entry.progressStatus === "completed"
                        ? "default"
                        : "secondary"
                    }
                    className="mt-0.5 shrink-0 text-xs"
                  >
                    {new Date(entry.entryDate).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">
                      {entry.actualSummary ||
                        entry.plannedSummary ||
                        "Kein Eintrag"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {entry.teacherNotes && (
                        <MessageSquare className="size-3 text-muted-foreground" />
                      )}
                      {entry.lessonPlanId && (
                        <Paperclip className="size-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
