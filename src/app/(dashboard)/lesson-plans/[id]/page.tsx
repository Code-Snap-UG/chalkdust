import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLessonPlan } from "@/lib/actions/lesson-plans";
import {
  Clock,
  Target,
  BookOpen,
  Users,
  Home,
  CheckCircle,
  FileEdit,
} from "lucide-react";
import type { LessonPlanOutput } from "@/lib/ai/schemas";

export default async function LessonPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await getLessonPlan(id);

  if (!plan) notFound();

  const objectives = plan.objectives as LessonPlanOutput["objectives"];
  const timeline = plan.timeline as LessonPlanOutput["timeline"];
  const differentiation =
    plan.differentiation as LessonPlanOutput["differentiation"];
  const materials = plan.materials as LessonPlanOutput["materials"];
  const totalMinutes = timeline.reduce(
    (sum, p) => sum + p.durationMinutes,
    0
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{plan.topic}</h1>
          <p className="text-muted-foreground">
            {plan.lessonDate
              ? new Date(plan.lessonDate).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Kein Datum"}{" "}
            &middot; {totalMinutes} Minuten
          </p>
        </div>
        <Badge variant={plan.status === "approved" ? "default" : "secondary"}>
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

      <div className="flex flex-col gap-6">
        {/* Objectives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4" />
              Lernziele
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  {obj.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Stundenablauf
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {timeline.map((phase, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{phase.phase}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {phase.method}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {phase.durationMinutes} Min.
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {phase.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Differentiation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Differenzierung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Schwächere Schüler</p>
              <p className="text-sm text-muted-foreground">
                {differentiation.weaker}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Stärkere Schüler</p>
              <p className="text-sm text-muted-foreground">
                {differentiation.stronger}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4" />
              Materialien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {materials.map((mat, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">
                    {mat.type}
                  </Badge>
                  <div>
                    <span className="font-medium">{mat.title}</span>
                    <p className="text-muted-foreground">{mat.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Homework */}
        {plan.homework && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="size-4" />
                Hausaufgaben
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{plan.homework}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
