import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Archive } from "lucide-react";
import { getClassGroups } from "@/lib/actions/class-groups";

export default async function ClassesPage() {
  const [activeClasses, archivedClasses] = await Promise.all([
    getClassGroups("active"),
    getClassGroups("archived"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meine Klassen</h1>
          <p className="mt-1 text-muted-foreground">
            Verwalte deine Klassen, Lehrpläne und Unterrichtsplanung.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/classes/new">
            <Plus className="mr-2 size-4" />
            Neue Klasse
          </Link>
        </Button>
      </div>

      {activeClasses.length === 0 && archivedClasses.length === 0 ? (
        /* Full empty state — teaches the interface */
        <div className="py-8">
          <div className="max-w-lg">
            <span className="font-display text-8xl font-bold leading-none text-primary/10">
              0
            </span>
            <h2 className="mt-4 text-2xl font-bold">
              Noch keine Klassen angelegt.
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Deine Klassen sind der Ausgangspunkt für alles. Lege eine Klasse
              an, lade dein Kerncurriculum hoch, und die KI erstellt vollständige
              Unterrichtspläne — zugeschnitten auf deine Lerngruppe.
            </p>
            <div className="mt-8">
              <Button asChild>
                <Link href="/classes/new">
                  <Plus className="mr-2 size-4" />
                  Erste Klasse anlegen
                </Link>
              </Button>
            </div>

            {/* What to expect */}
            <div className="mt-10 border-t pt-8">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                So funktioniert es
              </p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    n: "1",
                    title: "Klasse anlegen",
                    desc: "Name, Fach, Klassenstufe und Schuljahr eintragen.",
                  },
                  {
                    n: "2",
                    title: "Kerncurriculum hochladen",
                    desc: "Lade dein Lehrplan-PDF hoch — die KI liest es und richtet alle Pläne danach aus.",
                  },
                  {
                    n: "3",
                    title: "Unterrichtspläne generieren",
                    desc: "Gib ein Thema und eine Dauer an. Die KI erstellt in Sekunden einen fertigen Plan.",
                  },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-4">
                    <span className="font-display text-2xl font-bold leading-none text-primary/30 shrink-0 w-6">
                      {item.n}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeClasses.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {activeClasses.map((cls) => (
                <Link key={cls.id} href={`/classes/${cls.id}`}>
                  <Card className="group cursor-pointer transition-shadow hover:shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary/10">
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
            <div className="rounded-sm border border-dashed p-8">
              <p className="text-sm font-semibold">Keine aktiven Klassen</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Erstelle eine neue Klasse für das aktuelle Schuljahr.
              </p>
              <Button asChild size="sm" className="mt-4">
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
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Vergangene Schuljahre
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {archivedClasses.map((cls) => (
                  <Link key={cls.id} href={`/classes/${cls.id}`}>
                    <Card className="group cursor-pointer border-dashed opacity-70 transition-all hover:opacity-100 hover:shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted">
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
