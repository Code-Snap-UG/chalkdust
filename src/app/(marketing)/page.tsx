import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "KI-gestützte Planung",
    description:
      "Erstelle vollständige Unterrichtspläne in Sekunden. Die KI kennt Lehrpläne und passt sich deinem Unterrichtsstil an.",
    featured: true,
  },
  {
    title: "Übersichtliches Dashboard",
    description:
      "Behalte das gesamte Schuljahr im Blick. Verfolge Fortschritte und bevorstehende Stunden.",
  },
  {
    title: "Visueller Kalender",
    description:
      "Plane und visualisiere deinen Unterricht für das gesamte Semester. Verschiebe Stunden per Drag-and-Drop.",
  },
  {
    title: "Unterrichtsbibliothek",
    description:
      "Baue eine persönliche Bibliothek wiederverwendbarer Pläne auf. Sortiert nach Fach, Klasse und Thema.",
  },
];

const testimonials = [
  {
    quote:
      "Chalkdust hat meine Unterrichtsvorbereitung komplett verändert. Was mich früher Stunden gekostet hat, dauert jetzt 20 Minuten.",
    name: "Sarah K.",
    role: "Biologielehrerin, Gymnasium",
  },
  {
    quote:
      "Der KI-Assistent ist wie eine Kollegin, die immer verfügbar ist. Er schlägt Aktivitäten vor, auf die ich selbst nie gekommen wäre.",
    name: "Marcus T.",
    role: "Geschichtslehrer, Realschule",
  },
  {
    quote:
      "Endlich ein Tool, das speziell für Lehrkräfte entwickelt wurde. Es kennt die Lehrpläne und spart mir so viel Zeit.",
    name: "Priya R.",
    role: "Mathematiklehrerin, Grundschule",
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

const steps = [
  {
    step: "1",
    title: "Sag uns, was du brauchst",
    description:
      "Gib Fach, Klassenstufe, Thema und Dauer ein. Die KI übernimmt den Rest.",
  },
  {
    step: "2",
    title: "KI erstellt deinen Plan",
    description:
      "Erhalte in Sekunden einen vollständigen Unterrichtsplan mit Zielen, Aktivitäten und Bewertung.",
  },
  {
    step: "3",
    title: "Anpassen & einplanen",
    description:
      "Passe ihn nach Belieben an, trage ihn in deinen Kalender ein — und du bist bereit.",
  },
];

export default function LandingPage() {
  const [featuredFeature, ...otherFeatures] = features;

  return (
    <>
      {/* Hero — asymmetric, left-aligned, editorial */}
      <section className="px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-12 lg:grid-cols-[3fr_2fr]">
            <div>
              <p className="mb-6 text-sm font-medium uppercase tracking-widest text-primary">
                KI-gestützte Unterrichtsplanung
              </p>
              <h1 className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Besserer
                <br />
                Unterricht.
                <br />
                <em className="text-primary not-italic">Mehr Zeit.</em>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Chalkdust hilft Lehrkräften, mit der Kraft der KI
                herausragenden Unterricht zu planen — damit du weniger Zeit mit
                Vorbereitung und mehr Zeit mit dem Unterrichten verbringst.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/dashboard">Jetzt kostenlos starten</Link>
                </Button>
                <Link
                  href="#funktionen"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mehr erfahren →
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Keine Kreditkarte erforderlich · Kostenloser Plan verfügbar
              </p>
            </div>

            {/* Pull quote — teacher voice, right column */}
            <div className="hidden lg:flex flex-col justify-end pb-4">
              <blockquote className="border-l-2 border-primary pl-5">
                <p className="font-display text-xl italic leading-relaxed text-foreground/75">
                  &bdquo;Was mich früher Stunden gekostet hat, dauert jetzt 20
                  Minuten.&ldquo;
                </p>
                <footer className="mt-3 text-sm text-muted-foreground">
                  — Sarah K., Biologielehrerin
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Features — asymmetric: one large featured, three stacked */}
      <section id="funktionen" className="border-t px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Alles, was Lehrkräfte brauchen
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Von Grund auf für den modernen Unterricht entwickelt.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            {/* Featured large item */}
            <div className="flex flex-col gap-4 rounded-sm bg-muted/50 p-8 sm:p-10">
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                Kernfunktion
              </p>
              <h3 className="text-3xl font-bold sm:text-4xl">
                {featuredFeature?.title}
              </h3>
              <p className="max-w-md text-muted-foreground leading-relaxed">
                {featuredFeature?.description}
              </p>
              <div className="mt-2">
                <Button asChild>
                  <Link href="/dashboard">Jetzt ausprobieren</Link>
                </Button>
              </div>
            </div>

            {/* Stack of smaller feature items */}
            <div className="flex flex-col divide-y rounded-sm border">
              {otherFeatures.map((feature) => (
                <div key={feature.title} className="flex flex-col gap-1.5 p-5">
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — editorial large numbers, no circles */}
      <section id="so-funktionierts" className="border-t bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Vom leeren Blatt zum
              <br />
              Unterrichtsplan in Minuten
            </h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step}>
                <span className="font-display text-7xl font-bold leading-none text-primary/20">
                  {step.step}
                </span>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Geliebt von Lehrkräften
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="flex flex-col gap-4 border-t-2 border-primary/20 pt-5">
                <p className="font-display text-lg italic leading-relaxed text-foreground/80">
                  &bdquo;{t.quote}&ldquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="border-t bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Einfache, transparente Preise
            </h2>
            <p className="mt-3 text-muted-foreground">
              Starte kostenlos, upgrade wenn du bereit bist.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col gap-5 rounded-sm border p-6 ${
                  plan.highlighted
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="rounded-sm bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Beliebteste Wahl
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {plan.name}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <ul className="flex-1 space-y-2 border-t pt-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-8 lg:grid-cols-[2fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Bereit, deine Planung
                <br />
                zu transformieren?
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
                Schließe dich tausenden Lehrkräften an, die mit Chalkdust jede
                Woche Stunden sparen.
              </p>
              <Button size="lg" className="mt-8 h-12 px-10 text-base" asChild>
                <Link href="/dashboard">Jetzt kostenlos starten</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
