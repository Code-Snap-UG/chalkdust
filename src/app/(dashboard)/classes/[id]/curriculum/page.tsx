import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurriculum, getCurriculumTopics } from "@/lib/actions/curriculum";
import { BookOpen } from "lucide-react";

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const curriculum = await getCurriculum(id);
  const topics = await getCurriculumTopics(id);

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
        <BookOpen className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Kein Curriculum hochgeladen</h2>
          <p className="text-sm text-muted-foreground">
            Für diese Klasse wurde noch kein Kerncurriculum hinterlegt.
          </p>
        </div>
      </div>
    );
  }

  const competencyAreas = [
    ...new Set(topics.map((t) => t.competencyArea).filter(Boolean)),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Kerncurriculum</h2>
        <p className="text-muted-foreground">
          {curriculum.sourceFileName} &middot; {topics.length} Themen
        </p>
      </div>

      {competencyAreas.map((area) => (
        <Card key={area}>
          <CardHeader>
            <CardTitle className="text-base">{area}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {topics
              .filter((t) => t.competencyArea === area)
              .map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <Badge
                    variant="secondary"
                    className="mt-0.5 shrink-0 text-xs"
                  >
                    {topic.sortOrder + 1}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{topic.title}</p>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
