import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Sparkles,
    title: "KI-gestützte Planung",
    description:
      "Erstelle vollständige Unterrichtspläne in Sekunden. Unsere KI kennt Lehrpläne und passt sich deinem Unterrichtsstil an.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: LayoutDashboard,
    title: "Übersichtliches Dashboard",
    description:
      "Behalte das gesamte Schuljahr im Blick. Verfolge Fortschritte, bevorstehende Stunden und Unterrichtszeiten auf einen Blick.",
    color: "text-violet-600",
    bg: "bg-violet-100 dark:bg-violet-950/40",
  },
  {
    icon: Calendar,
    title: "Visueller Kalender",
    description:
      "Plane und visualisiere deinen Unterricht für das gesamte Semester. Verschiebe Stunden per Drag-and-Drop ganz einfach.",
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  {
    icon: BookOpen,
    title: "Unterrichtsbibliothek",
    description:
      "Baue eine persönliche Bibliothek wiederverwendbarer Unterrichtspläne auf. Sortiere nach Fach, Klasse und Thema.",
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-950/40",
  },
];

const testimonials = [
  {
    quote:
      "Chalkdust hat meine Unterrichtsvorbereitung komplett verändert. Was mich früher Stunden gekostet hat, dauert jetzt 20 Minuten.",
    name: "Sarah K.",
    role: "Biologielehrerin, Gymnasium",
    initials: "SK",
  },
  {
    quote:
      "Der KI-Assistent ist wie eine Kollegin, die immer verfügbar ist. Er schlägt Aktivitäten vor, auf die ich selbst nie gekommen wäre.",
    name: "Marcus T.",
    role: "Geschichtslehrer, Realschule",
    initials: "MT",
  },
  {
    quote:
      "Endlich ein Tool, das speziell für Lehrkräfte entwickelt wurde. Es kennt die Lehrpläne und spart mir so viel Zeit.",
    name: "Priya R.",
    role: "Mathematiklehrerin, Grundschule",
    initials: "PR",
  },
];

const plans = [
  {
    name: "Kostenlos",
    price: "0 €",
    period: "für immer",
    description: "Perfekt zum Einstieg",
    features: [
      "5 Unterrichtspläne pro Monat",
      "KI-Assistent (10 Nachrichten/Monat)",
      "Einfache Kalenderansicht",
      "E-Mail-Support",
    ],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "12 €",
    period: "pro Monat",
    description: "Für engagierte Lehrkräfte",
    features: [
      "Unbegrenzte Unterrichtspläne",
      "Unbegrenzter KI-Assistent",
      "Vollständiger Kalender & Planung",
      "Unterrichtsbibliothek & Vorlagen",
      "Prioritäts-Support",
      "Export als PDF & Google Docs",
    ],
    cta: "Gratis testen",
    highlighted: true,
  },
  {
    name: "Schule",
    price: "8 €",
    period: "pro Lehrkraft/Monat",
    description: "Für Schulen & Fachschaften",
    features: [
      "Alles aus Pro",
      "Teamzusammenarbeit",
      "Admin-Dashboard",
      "SSO & LMS-Integrationen",
      "Persönlicher Ansprechpartner",
      "Individuelles Onboarding",
    ],
    cta: "Vertrieb kontaktieren",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <Sparkles className="size-3 text-primary" />
            KI-gestützte Unterrichtsplanung
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Besserer Unterricht.{" "}
            <span className="text-primary">Mehr Zeit zum Lehren.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Chalkdust hilft Lehrkräften, mit der Kraft der KI herausragenden
            Unterricht zu planen und zu gestalten — damit du weniger Zeit mit
            Vorbereitung und mehr Zeit mit dem Unterrichten verbringst.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/dashboard">
                <GraduationCap className="mr-2 size-5" />
                Jetzt kostenlos starten
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/dashboard">So funktioniert&apos;s</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Keine Kreditkarte erforderlich · Kostenloser Plan verfügbar
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="funktionen" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Alles, was Lehrkräfte brauchen
            </h2>
            <p className="mt-3 text-muted-foreground">
              Von Grund auf für den modernen Unterricht entwickelt.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-sm bg-muted/30">
                <CardHeader>
                  <div className={`mb-2 flex size-10 items-center justify-center rounded-lg ${feature.bg}`}>
                    <feature.icon className={`size-5 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="so-funktionierts" className="bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Vom leeren Blatt zum Unterrichtsplan in Minuten
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                icon: Zap,
                title: "Sag uns, was du brauchst",
                description:
                  "Gib Fach, Klassenstufe, Thema und Dauer ein. Die KI übernimmt den Rest.",
              },
              {
                step: "2",
                icon: Sparkles,
                title: "KI erstellt deinen Plan",
                description:
                  "Erhalte in Sekunden einen vollständigen Unterrichtsplan mit Zielen, Aktivitäten und Bewertung.",
              },
              {
                step: "3",
                icon: CheckCircle2,
                title: "Anpassen & einplanen",
                description:
                  "Passe ihn nach Belieben an, trage ihn in deinen Kalender ein und du bist bereit.",
              },
            ].map((step) => (
              <div key={step.step} className="flex flex-col items-center text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {step.step}
                </div>
                <step.icon className="mb-3 size-6 text-primary" />
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Geliebt von Lehrkräften
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tausende Lehrkräfte sparen bereits Zeit mit Chalkdust.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-none shadow-sm">
                <CardHeader>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    &bdquo;{t.quote}&ldquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Einfache, transparente Preise
            </h2>
            <p className="mt-3 text-muted-foreground">
              Starte kostenlos, upgrade wenn du bereit bist.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge className="px-3 text-xs">Beliebteste Wahl</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <ul className="flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/dashboard">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Bereit, deine Planung zu transformieren?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Schließe dich tausenden Lehrkräften an, die mit Chalkdust jede Woche
            Stunden sparen.
          </p>
          <Button size="lg" className="mt-8 h-12 px-10 text-base" asChild>
            <Link href="/dashboard">
              <GraduationCap className="mr-2 size-5" />
              Jetzt kostenlos starten
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
