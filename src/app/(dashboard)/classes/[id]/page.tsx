import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClassGroup } from "@/lib/actions/class-groups";
import { getCurriculumTopics } from "@/lib/actions/curriculum";
import { getDiaryEntries } from "@/lib/actions/diary";
import { getLessonPlans } from "@/lib/actions/lesson-plans";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Sparkles,
  Target,
  CheckCircle,
  Paperclip,
  MessageSquare,
} from "lucide-react";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classGroup = await getClassGroup(id);

  if (!classGroup) notFound();

  const [topics, diaryEntries, lessonPlans] = await Promise.all([
    getCurriculumTopics(id),
    getDiaryEntries(id),
    getLessonPlans(id),
  ]);

  const completedEntries = diaryEntries.filter(
    (e) => e.progressStatus === "completed"
  );
  const plannedEntries = diaryEntries.filter(
    (e) => e.progressStatus === "planned"
  );
  const totalHours = lessonPlans.reduce(
    (sum, p) => sum + (p.durationMinutes || 0),
    0
  );
  const topicsCovered = completedEntries.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {classGroup.name} &ndash; {classGroup.subject}
          </h1>
          <p className="text-muted-foreground">
            Klasse {classGroup.grade} &middot; Schuljahr{" "}
            {classGroup.schoolYear}
          </p>
        </div>
        <Button asChild>
          <Link href={`/classes/${id}/plan`}>
            <Sparkles className="mr-2 size-4" />
            Stunde planen
          </Link>
        </Button>
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
                {diaryEntries.length} Einträge &middot; Letzte Stunden einsehen
                und dokumentieren.
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
            {diaryEntries
              .filter((e) => e.progressStatus !== "planned")
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
