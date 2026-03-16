import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { getClassGroups } from "@/lib/actions/class-groups";
import { getLessonPlans } from "@/lib/actions/lesson-plans";

export default async function DashboardPage() {
  const [classes, plans] = await Promise.all([
    getClassGroups(),
    getLessonPlans(),
  ]);

  const approvedPlans: typeof plans = [];
  const draftPlans: typeof plans = [];
  for (const p of plans) {
    if (p.status === "approved") approvedPlans.push(p);
    else if (p.status === "draft") draftPlans.push(p);
  }
  const totalMinutes = approvedPlans.reduce(
    (sum, p) => sum + (p.durationMinutes || 0),
    0
  );

  const recentPlans = plans.slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      {/* Page heading */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Übersicht deiner Unterrichtsplanung.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/classes/new">
            <Plus className="mr-2 size-4" />
            Neue Klasse
          </Link>
        </Button>
      </div>

      {/* Inline stats — editorial row, not hero-metric cards */}
      <div className="flex flex-wrap gap-x-10 gap-y-4 border-b border-t py-5">
        <div>
          <span className="font-display text-4xl font-bold leading-none">
            {classes.length}
          </span>
          <p className="mt-1 text-xs text-muted-foreground">Klassen</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <span className="font-display text-4xl font-bold leading-none">
            {plans.length}
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            Unterrichtspläne
          </p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <span className="font-display text-4xl font-bold leading-none">
            {approvedPlans.length}
          </span>
          <p className="mt-1 text-xs text-muted-foreground">Freigegeben</p>
        </div>
        <div className="w-px bg-border hidden sm:block" />
        <div>
          <span className="font-display text-4xl font-bold leading-none">
            {Math.round(totalMinutes / 60)}
            <span className="text-2xl text-muted-foreground">h</span>
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            Geplante Unterrichtszeit
          </p>
        </div>
      </div>

      {/* Main content: 2/3 plans + 1/3 AI CTA */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent plans — takes 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Letzte Unterrichtspläne</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/lesson-plans" className="text-muted-foreground hover:text-foreground">
                Alle ansehen →
              </Link>
            </Button>
          </div>

          {recentPlans.length === 0 ? (
            <div className="rounded-sm border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                Noch keine Unterrichtspläne.{" "}
                <Link href="/classes" className="text-primary underline-offset-4 hover:underline">
                  Wähle eine Klasse
                </Link>{" "}
                und starte mit der Planung.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y rounded-sm border">
              {recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/lesson-plans/${plan.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary/10">
                    <BookOpen className="size-4 text-primary" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {plan.topic}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {plan.durationMinutes} Min.
                      </span>
                      {plan.lessonDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(plan.lessonDate).toLocaleDateString("de-DE")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={plan.status === "approved" ? "default" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {plan.status === "approved" ? "Freigegeben" : "Entwurf"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links — right column */}
        <div className="flex flex-col gap-4">
          {classes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="px-1 text-xs text-muted-foreground">Meine Klassen</p>
              {classes.slice(0, 4).map((cls) => (
                <Link
                  key={cls.id}
                  href={`/classes/${cls.id}`}
                  className="flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="truncate font-medium">
                    {cls.name} – {cls.subject}
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    Kl. {cls.grade}
                  </span>
                </Link>
              ))}
              {classes.length > 4 && (
                <Link
                  href="/classes"
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  +{classes.length - 4} weitere Klassen →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
