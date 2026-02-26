import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Lightbulb,
  ListChecks,
  Send,
  Sparkles,
  Target,
} from "lucide-react";

const suggestions = [
  {
    icon: BookOpen,
    label: "Unterrichtsplan erstellen",
    prompt: "Erstelle einen 45-minütigen Unterrichtsplan zur Fotosynthese für Klasse 7",
  },
  {
    icon: ListChecks,
    label: "Aktivitäten vorschlagen",
    prompt:
      "Schlage 5 ansprechende Unterrichtsaktivitäten für die Französische Revolution vor",
  },
  {
    icon: Target,
    label: "Am Lehrplan ausrichten",
    prompt:
      "Hilf mir, meine Mathestunde zu Brüchen am Lehrplan für Klasse 5 auszurichten",
  },
  {
    icon: Lightbulb,
    label: "Differenzierung",
    prompt:
      "Wie kann ich diese Shakespeare-Stunde für leistungsstarke und schwächere Leser differenzieren?",
  },
];

export default function AIAssistantPage() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KI-Assistent</h1>
        <p className="text-muted-foreground">
          Dein intelligenter Planungshelfer. Stelle alle Fragen rund um
          Unterrichtsplanung, Lehrpläne oder Unterrichtsmethoden.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {/* Empty state / welcome */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="size-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">
              Wie kann ich dir heute helfen?
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ich helfe dir beim Erstellen von Unterrichtsplänen, schlage
              Aktivitäten vor, richte deinen Unterricht am Lehrplan aus und
              vieles mehr.
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.label}
                className="cursor-pointer text-left transition-colors hover:bg-accent/60 hover:shadow-sm"
              >
                <CardHeader className="pb-1 pt-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <suggestion.icon className="size-4 text-primary" />
                    {suggestion.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {suggestion.prompt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Unterrichtspläne
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Aktivitäten & Spiele
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Bewertungsideen
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Differenzierung
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Lehrplanausrichtung
            </Badge>
          </div>
        </div>

        {/* Input area */}
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Stelle eine Frage zur Unterrichtsplanung …"
              className="h-12 pr-12 text-sm"
            />
          </div>
          <Button size="icon" className="size-12 shrink-0">
            <Send className="size-4" />
            <span className="sr-only">Nachricht senden</span>
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          KI kann Fehler machen. Überprüfe generierten Inhalt stets, bevor du
          ihn im Unterricht verwendest.
        </p>
      </div>
    </div>
  );
}
