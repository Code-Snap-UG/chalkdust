import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Users, Archive } from "lucide-react";
import { getClassGroups } from "@/lib/actions/class-groups";

export default async function ClassesPage() {
  const [activeClasses, archivedClasses] = await Promise.all([
    getClassGroups("active"),
    getClassGroups("archived"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meine Klassen</h1>
          <p className="text-muted-foreground">
            Verwalte deine Klassen, Lehrpläne und Unterrichtsplanung.
          </p>
        </div>
        <Button asChild>
          <Link href="/classes/new">
            <Plus className="mr-2 size-4" />
            Neue Klasse
          </Link>
        </Button>
      </div>

      {activeClasses.length === 0 && archivedClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="size-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Noch keine Klassen</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Erstelle deine erste Klasse, um mit der KI-gestützten
              Unterrichtsplanung zu beginnen.
            </p>
          </div>
          <Button asChild>
            <Link href="/classes/new">
              <Plus className="mr-2 size-4" />
              Erste Klasse anlegen
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {activeClasses.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {activeClasses.map((cls) => (
                <Link key={cls.id} href={`/classes/${cls.id}`}>
                  <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <BookOpen className="size-4 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {cls.schoolYear}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2 text-base leading-snug">
                        {cls.name} &ndash; {cls.subject}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Klasse {cls.grade}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {activeClasses.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="size-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold">Keine aktiven Klassen</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Erstelle eine neue Klasse für das aktuelle Schuljahr.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/classes/new">
                  <Plus className="mr-2 size-4" />
                  Neue Klasse anlegen
                </Link>
              </Button>
            </div>
          )}

          {archivedClasses.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Archive className="size-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-muted-foreground">
                  Vergangene Schuljahre
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {archivedClasses.map((cls) => (
                  <Link key={cls.id} href={`/classes/${cls.id}`}>
                    <Card className="group cursor-pointer border-dashed opacity-70 transition-all hover:opacity-100 hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            <BookOpen className="size-4 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {cls.schoolYear}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Archiviert
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="mt-2 text-base leading-snug text-muted-foreground">
                          {cls.name} &ndash; {cls.subject}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Klasse {cls.grade}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
