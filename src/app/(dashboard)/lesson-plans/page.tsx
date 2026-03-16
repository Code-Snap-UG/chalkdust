import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";
import { getLessonPlans } from "@/lib/actions/lesson-plans";
import { db } from "@/lib/db";
import { classGroups } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { cn } from "@/lib/utils";

export default async function LessonPlansPage() {
  const plans = await getLessonPlans();

  const classGroupIds = [...new Set(plans.map((p) => p.classGroupId))];
  const classGroupMap: Record<string, { id: string; name: string; subject: string; grade: string }> = {};

  if (classGroupIds.length > 0) {
    const cgs = await db
      .select()
      .from(classGroups)
      .where(inArray(classGroups.id, classGroupIds));
    for (const cg of cgs) {
      classGroupMap[cg.id] = { id: cg.id, name: cg.name, subject: cg.subject, grade: cg.grade };
    }
  }

  // Group plans by class, preserving recency order (plans are sorted by createdAt desc)
  const seenClassIds: string[] = [];
  const plansByClass = new Map<string, typeof plans>();
  for (const plan of plans) {
    if (!plansByClass.has(plan.classGroupId)) {
      seenClassIds.push(plan.classGroupId);
      plansByClass.set(plan.classGroupId, []);
    }
    plansByClass.get(plan.classGroupId)!.push(plan);
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Unterrichtspläne
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle erstellten Unterrichtspläne auf einen Blick.
        </p>
      </div>

      {plans.length === 0 ? (

        /* ── Empty state ── */
        <div className="py-12">
          <p className="font-display text-lg font-medium text-muted-foreground/60">
            Noch keine Unterrichtspläne.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/50">
            Wähle eine Klasse und erstelle deinen ersten KI-gestützten Plan.
          </p>
          <Button asChild className="mt-6">
            <Link href="/classes">
              <Sparkles className="size-4" />
              Zu meinen Klassen
            </Link>
          </Button>
        </div>

      ) : (

        /* ── Grouped list ── */
        <div className="flex flex-col gap-10">
          {seenClassIds.map((classId) => {
            const cg = classGroupMap[classId];
            const classPlans = plansByClass.get(classId) ?? [];

            return (
              <div key={classId}>

                {/* Class header */}
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {cg ? (
                      <Link
                        href={`/classes/${cg.id}`}
                        className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {cg.name} &ndash; {cg.subject}
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Unbekannte Klasse
                      </span>
                    )}
                    {cg && (
                      <span className="text-xs text-muted-foreground/40">
                        Klasse {cg.grade}
                      </span>
                    )}
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground/40">
                    {classPlans.length}{" "}
                    {classPlans.length === 1 ? "Plan" : "Pläne"}
                  </span>
                </div>

                {/* Plan rows */}
                <div className="flex flex-col border-t">
                  {classPlans.map((plan) => {
                    const isApproved = plan.status === "approved";
                    return (
                      <Link
                        key={plan.id}
                        href={`/lesson-plans/${plan.id}`}
                        className="group -mx-1 flex items-baseline gap-3 rounded-sm border-b px-1 py-3.5 transition-colors hover:bg-muted/40 sm:gap-4"
                      >
                        {/* Date */}
                        <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {plan.lessonDate
                            ? new Date(plan.lessonDate).toLocaleDateString(
                                "de-DE",
                                { day: "numeric", month: "short" }
                              )
                            : <span className="text-muted-foreground/30">&ndash;</span>}
                        </span>

                        {/* Topic */}
                        <p className="min-w-0 flex-1 text-sm font-medium line-clamp-1">
                          {plan.topic || "Kein Titel"}
                        </p>

                        {/* Duration */}
                        <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">
                          {plan.durationMinutes} Min.
                        </span>

                        {/* Status */}
                        <span
                          className={cn(
                            "hidden shrink-0 text-[0.65rem] font-semibold tracking-[0.1em] uppercase sm:inline",
                            isApproved
                              ? "text-primary"
                              : "text-muted-foreground/35"
                          )}
                        >
                          {isApproved ? "Freigegeben" : "Entwurf"}
                        </span>

                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/70" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
