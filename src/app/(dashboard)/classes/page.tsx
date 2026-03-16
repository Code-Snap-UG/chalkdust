import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getClassGroups } from "@/lib/actions/class-groups";

export default async function ClassesPage() {
  const [activeClasses, archivedClasses] = await Promise.all([
    getClassGroups("active"),
    getClassGroups("archived"),
  ]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Meine Klassen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte deine Klassen, Lehrpläne und Unterrichtsplanung.
          </p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/classes/new">
            <Plus className="size-4" />
            Neue Klasse
          </Link>
        </Button>
      </div>

      {activeClasses.length === 0 && archivedClasses.length === 0 ? (

        /* ── Full empty state ── */
        <div className="py-4 sm:py-8">
          <div className="max-w-lg">
            <span className="font-display text-6xl font-bold leading-none text-primary/10 sm:text-8xl">
              0
            </span>
            <h2 className="mt-4 text-xl font-bold sm:text-2xl">
              Noch keine Klassen angelegt.
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Deine Klassen sind der Ausgangspunkt für alles. Lege eine Klasse
              an, lade deinen Lehrplan hoch, und die KI erstellt vollständige
              Unterrichtspläne — zugeschnitten auf deine Lerngruppe.
            </p>
            <div className="mt-8">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/classes/new">
                  <Plus className="size-4" />
                  Erste Klasse anlegen
                </Link>
              </Button>
            </div>

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
                    title: "Lehrplan hochladen",
                    desc: "Lade dein Lehrplan-PDF hoch — die KI liest es und richtet alle Pläne danach aus.",
                  },
                  {
                    n: "3",
                    title: "Unterrichtspläne generieren",
                    desc: "Gib ein Thema und eine Dauer an. Die KI erstellt in Sekunden einen fertigen Plan.",
                  },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-4">
                    <span className="w-6 shrink-0 font-display text-2xl font-bold leading-none text-primary/30">
                      {item.n}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
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
          {/* ── Active classes ── */}
          {activeClasses.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 border-t sm:grid-cols-2 lg:grid-cols-3">
              {activeClasses.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/classes/${cls.id}`}
                  className="group flex flex-col gap-1 border-b py-5 transition-colors hover:bg-muted/40 -mx-1 px-1 rounded-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display truncate text-xl font-bold leading-tight transition-colors group-hover:text-primary">
                      {cls.name}
                    </p>
                    <span className="shrink-0 text-[0.6rem] font-medium tracking-[0.1em] uppercase text-muted-foreground/40">
                      {cls.schoolYear}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {cls.subject}
                  </p>
                  <p className="text-xs text-muted-foreground/50">
                    Klasse {cls.grade}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed p-6 sm:p-8">
              <p className="text-sm font-semibold">Keine aktiven Klassen</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Erstelle eine neue Klasse für das aktuelle Schuljahr.
              </p>
              <Button asChild size="sm" className="mt-4 w-full sm:w-auto">
                <Link href="/classes/new">
                  <Plus className="size-4" />
                  Neue Klasse anlegen
                </Link>
              </Button>
            </div>
          )}

          {/* ── Archived classes ── */}
          {archivedClasses.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <p className="shrink-0 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Vergangene Schuljahre
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 gap-x-8 border-t sm:grid-cols-2 lg:grid-cols-3">
                {archivedClasses.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    className="group flex flex-col gap-1 border-b py-5 opacity-50 transition-all hover:bg-muted/40 hover:opacity-100 -mx-1 px-1 rounded-sm"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-display truncate text-xl font-bold leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                        {cls.name}
                      </p>
                      <span className="shrink-0 text-[0.6rem] font-medium tracking-[0.1em] uppercase text-muted-foreground/40">
                        {cls.schoolYear}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {cls.subject}
                    </p>
                    <p className="text-xs text-muted-foreground/50">
                      Klasse {cls.grade}
                    </p>
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
