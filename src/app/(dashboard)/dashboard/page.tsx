import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getClassGroups } from "@/lib/actions/class-groups";
import { getLessonPlans } from "@/lib/actions/lesson-plans";
import { db } from "@/lib/db";
import { diaryEntries } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function DashboardPage() {
  const [classes, plans] = await Promise.all([
    getClassGroups(),
    getLessonPlans(),
  ]);

  const approvedPlans = plans.filter((p) => p.status === "approved");
  const draftPlans = plans.filter((p) => p.status === "draft");
  const totalMinutes = approvedPlans.reduce(
    (sum, p) => sum + (p.durationMinutes || 0),
    0
  );

  const recentPlans = plans.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Übersicht deiner Unterrichtsplanung.
          </p>
        </div>
        <Button asChild>
          <Link href="/classes">
            <Users className="mr-2 size-4" />
            Meine Klassen
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Klassen
            </CardTitle>
            <div className="rounded-md bg-blue-50 p-1.5 dark:bg-blue-950/40">
              <Users className="size-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Aktive Klassen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unterrichtspläne
            </CardTitle>
            <div className="rounded-md bg-violet-50 p-1.5 dark:bg-violet-950/40">
              <BookOpen className="size-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {approvedPlans.length} freigegeben, {draftPlans.length} Entwürfe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abgehaltene Stunden
            </CardTitle>
            <div className="rounded-md bg-emerald-50 p-1.5 dark:bg-emerald-950/40">
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPlans.length}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Freigegebene Pläne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unterrichtszeit
            </CardTitle>
            <div className="rounded-md bg-amber-50 p-1.5 dark:bg-amber-950/40">
              <Clock className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(totalMinutes / 60)}h
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Geplante Unterrichtszeit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent plans */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Letzte Unterrichtspläne</CardTitle>
                <CardDescription>
                  Deine zuletzt erstellten Unterrichtspläne
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/lesson-plans">Alle ansehen</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Unterrichtspläne erstellt.{" "}
                <Link href="/classes" className="text-primary hover:underline">
                  Starte hier
                </Link>
                .
              </p>
            ) : (
              recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/lesson-plans/${plan.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <BookOpen className="size-4 text-primary" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {plan.topic}
                      </span>
                      <Badge
                        variant={
                          plan.status === "approved" ? "default" : "secondary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {plan.status === "approved" ? "Freigegeben" : "Entwurf"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{plan.durationMinutes} Min.</span>
                      {plan.lessonDate && (
                        <>
                          <span>&middot;</span>
                          <Calendar className="size-3" />
                          <span>
                            {new Date(plan.lessonDate).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Assistant CTA */}
        <Card className="flex flex-col bg-gradient-to-br from-primary/5 via-primary/[0.03] to-transparent">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <CardTitle className="mt-2">KI-gestützte Planung</CardTitle>
            <CardDescription>
              Lass die KI in Minuten strukturierte Unterrichtspläne erstellen,
              abgestimmt auf dein Kerncurriculum.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Am Kerncurriculum ausgerichtet
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Differenzierung für alle Lernenden
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Verfeinern per Chat-Konversation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Klassentagebuch & Fortschritt
              </li>
            </ul>
            <Button className="w-full" asChild>
              <Link href="/classes">
                <Sparkles className="mr-2 size-4" />
                Klasse wählen & planen
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
