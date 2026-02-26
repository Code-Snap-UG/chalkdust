import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Clock, Sparkles, CheckCircle, FileEdit } from "lucide-react";
import { getLessonPlans } from "@/lib/actions/lesson-plans";
import { db } from "@/lib/db";
import { classGroups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function LessonPlansPage() {
  const plans = await getLessonPlans();

  const classGroupIds = [...new Set(plans.map((p) => p.classGroupId))];
  const classGroupMap: Record<string, { name: string; subject: string; grade: string }> = {};

  for (const cgId of classGroupIds) {
    const [cg] = await db
      .select()
      .from(classGroups)
      .where(eq(classGroups.id, cgId))
      .limit(1);
    if (cg) {
      classGroupMap[cgId] = { name: cg.name, subject: cg.subject, grade: cg.grade };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Unterrichtspläne
          </h1>
          <p className="text-muted-foreground">
            Alle erstellten Unterrichtspläne auf einen Blick.
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Noch keine Unterrichtspläne
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Wähle eine Klasse und erstelle deinen ersten KI-gestützten
              Unterrichtsplan.
            </p>
          </div>
          <Button asChild>
            <Link href="/classes">
              <Sparkles className="mr-2 size-4" />
              Zu meinen Klassen
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const cg = classGroupMap[plan.classGroupId];
            return (
              <Link key={plan.id} href={`/lesson-plans/${plan.id}`}>
                <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <BookOpen className="size-4 text-primary" />
                      </div>
                      <Badge
                        variant={
                          plan.status === "approved" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {plan.status === "approved" ? (
                          <>
                            <CheckCircle className="mr-1 size-3" />
                            Freigegeben
                          </>
                        ) : (
                          <>
                            <FileEdit className="mr-1 size-3" />
                            Entwurf
                          </>
                        )}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 text-base leading-snug">
                      {plan.topic}
                    </CardTitle>
                    {cg && (
                      <CardDescription>
                        {cg.name} &ndash; {cg.subject} (Klasse {cg.grade})
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {plan.durationMinutes} Min.
                      </div>
                      <span>
                        {plan.lessonDate
                          ? new Date(plan.lessonDate).toLocaleDateString(
                              "de-DE"
                            )
                          : "Kein Datum"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
