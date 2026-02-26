import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTH = "Februar 2026";

const calendarDays = Array.from({ length: 35 }, (_, i) => {
  const day = i - 6;
  return day > 0 && day <= 28 ? day : null;
});

const events: Record<number, { title: string; subject: string; color: string }[]> = {
  9: [{ title: "Fotosynthese", subject: "Biologie", color: "bg-emerald-500" }],
  10: [{ title: "Frz. Revolution", subject: "Geschichte", color: "bg-amber-500" }],
  11: [{ title: "Quadrat. Gl.", subject: "Mathematik", color: "bg-blue-500" }],
  16: [
    { title: "Shakespeare", subject: "Englisch", color: "bg-violet-500" },
    { title: "Newtons Gesetze", subject: "Physik", color: "bg-rose-500" },
  ],
  18: [{ title: "Wasserkreislauf", subject: "Geographie", color: "bg-cyan-500" }],
  23: [{ title: "Zellteilung", subject: "Biologie", color: "bg-emerald-500" }],
  24: [{ title: "Zweiter Weltkrieg", subject: "Geschichte", color: "bg-amber-500" }],
  25: [{ title: "Geometrie", subject: "Mathematik", color: "bg-blue-500" }],
};

const today = 24;

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground">
            Sieh und plane deinen Unterricht über das gesamte Schuljahr.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Stunde einplanen
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{MONTH}</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Heute
              </Button>
              <Button variant="outline" size="icon" className="size-8">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7">
            {DAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px rounded-lg bg-border overflow-hidden">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`min-h-[90px] p-1.5 text-sm ${
                  day ? "bg-background hover:bg-accent/30 cursor-pointer transition-colors" : "bg-muted/30"
                }`}
              >
                {day && (
                  <>
                    <span
                      className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                        day === today
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {(events[day] ?? []).map((event, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-accent/50"
                        >
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${event.color}`}
                          />
                          <span className="truncate text-xs">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Diese Woche
        </h2>
        <div className="space-y-2">
          {Object.entries(events)
            .filter(([day]) => Number(day) >= 24 && Number(day) <= 28)
            .flatMap(([day, dayEvents]) =>
              dayEvents.map((event, i) => (
                <div
                  key={`${day}-${i}`}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className={`size-2 shrink-0 rounded-full ${event.color}`} />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(day)}. Feb. 2026
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {event.subject}
                    </Badge>
                  </div>
                </div>
              ))
            )}
        </div>
      </div>
    </div>
  );
}
