import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getClassGroup } from "@/lib/actions/class-groups";
import { getSeriesForClass } from "@/lib/actions/series";
import { notFound } from "next/navigation";
import { Plus, Layers, ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  completed: "Abgeschlossen",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  draft: "outline",
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/classes/${id}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            {classGroup.name}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Unterrichtsreihen
          </h1>
          <p className="text-muted-foreground">
            Planen Sie mehrstündige Unterrichtseinheiten mit Meilensteinen.
          </p>
        </div>
        {!isArchived && (
          <Button asChild>
            <Link href={`/classes/${id}/series/new`}>
              <Plus className="mr-2 size-4" />
              Reihe planen
            </Link>
          </Button>
        )}
      </div>

      {seriesList.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Layers className="size-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Noch keine Unterrichtsreihen</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Erstellen Sie eine Reihe, um mehrere Stunden zu einem Thema
              zusammenhängend zu planen.
            </p>
          </div>
          {!isArchived && (
            <Button asChild>
              <Link href={`/classes/${id}/series/new`}>
                <Plus className="mr-2 size-4" />
                Erste Reihe erstellen
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {seriesList.map((s) => (
            <Link key={s.id} href={`/classes/${id}/series/${s.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold line-clamp-1">{s.title}</p>
                      <Badge variant={STATUS_VARIANT[s.status] ?? "outline"} className="shrink-0 text-xs">
                        {STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-sm text-muted-foreground">
                    <p>{s.estimatedLessons} Stunden</p>
                    {s.estimatedWeeks && (
                      <p className="text-xs">~{s.estimatedWeeks} Wochen</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
