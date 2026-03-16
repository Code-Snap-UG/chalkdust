import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    tag: "Planung",
    heading: "Chalkdust kennt deinen Lehrplan.",
    body: "Lade deinen Lehrplan einmal hoch — und Chalkdust weiß, was deine Klasse in diesem Jahr lernen muss. Jeder generierte Plan greift darauf zurück. Nie wieder generische Stunden, die am Curriculum vorbeigehen.",
    aside:
      "Lehrplan-Themen, Kompetenzfelder, Schuljahresstruktur — alles fließt in jeden einzelnen Plan ein.",
    flipped: false,
  },
  {
    tag: "Gedächtnis",
    heading: "Was wirklich passiert ist.",
    body: "Das Klassentagebuch ist das Herzstück. Jeder abgehaltene Plan wird zum Eintrag — ergänzt durch deine Notizen, Materialien und den tatsächlichen Unterrichtsverlauf. Je reicher das Tagebuch, desto präziser jeder nächste Plan.",
    aside:
      "Chalkdust lernt: Welche Aktivitäten kamen gut an? Welche Themen brauchten mehr Zeit? Wohin entwickelt sich die Klasse?",
    flipped: true,
  },
  {
    tag: "Reihenplanung",
    heading: "Vom Einzelnen zum Ganzen.",
    body: "Plane nicht nur einzelne Stunden — plane Unterrichtsreihen. Definiere Meilensteine, verteile Stunden auf Lernziele, lass Chalkdust die Einzelstunden vorschlagen. Ein kohärenter Bogen statt loser Einzelteile.",
    aside:
      "Mehrere Stunden, ein roter Faden. Die Reihe kennt ihren Anfang und ihr Ende.",
    flipped: false,
  },
  {
    tag: "Bausteine",
    heading: "Guter Unterricht verschwindet nicht.",
    body: "Die Einstiegsaufgabe, die jeder Klasse gelingt. Das Gruppenformat, das immer zieht. Die Erklärung, die sitzt. Speichere solche Momente als Bausteine — und rufe sie in jedem neuen Plan wieder ab.",
    aside:
      "Dein persönliches Repertoire wächst mit jedem Schuljahr. Das Beste geht nie verloren.",
    flipped: true,
  },
];

const testimonials = [
  {
    quote:
      "Chalkdust hat meine Unterrichtsvorbereitung komplett verändert. Was mich früher Stunden gekostet hat, dauert jetzt 20 Minuten — und der Plan ist besser, weil er meine Klasse wirklich kennt.",
    name: "Sarah K.",
    role: "Biologielehrerin, Gymnasium",
    featured: true,
  },
  {
    quote:
      "Der KI-Assistent ist wie eine Kollegin, die immer verfügbar ist. Er schlägt Aktivitäten vor, auf die ich selbst nie gekommen wäre.",
    name: "Marcus T.",
    role: "Geschichtslehrer, Realschule",
    featured: false,
  },
  {
    quote:
      "Endlich ein Tool, das speziell für Lehrkräfte entwickelt wurde. Es kennt die Lehrpläne und spart mir so viel Zeit.",
    name: "Priya R.",
    role: "Mathematiklehrerin, Grundschule",
    featured: false,
  },
];

const plans = [
  {
    name: "Kostenlos",
    price: "0 €",
    period: "für immer",
    description: "Zum Kennenlernen",
    features: [
      "5 Unterrichtspläne pro Monat",
      "KI-Assistent (10 Nachrichten/Monat)",
      "Klassentagebuch",
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
      "Reihenplanung & Bausteine",
      "Lehrplan-Upload & Analyse",
      "Schuljahres-Übergabe",
      "Prioritäts-Support",
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

const loopSteps = [
  {
    label: "Planen",
    description:
      "Mit KI-Unterstützung, Lehrplan-Kontext und allem, was du über diese Klasse weißt.",
  },
  {
    label: "Unterrichten",
    description: "Der Plan ist dein Ausgangspunkt — du entscheidest, was daraus wird.",
  },
  {
    label: "Reflektieren",
    description:
      "Was hat funktioniert? Was nicht? Das Tagebuch hält fest, was wirklich passiert ist.",
  },
  {
    label: "Wiederverwenden",
    description:
      "Bausteine, Reihen, Pläne. Das Beste bleibt erhalten und wird besser.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-16 lg:grid-cols-[3fr_2fr]">
            {/* Left — headline */}
            <div>
              <p
                className="ink-stage mb-7 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                style={{ animation: "inkFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s both" }}
              >
                KI-gestützte Unterrichtsplanung
              </p>
              <h1
                className="ink-stage font-display text-[clamp(3.2rem,8vw,6rem)] font-bold leading-[0.92] tracking-tight"
                style={{ animation: "inkFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both" }}
              >
                Besserer
                <br />
                Unterricht.
                <br />
                <em className="text-primary not-italic">Mehr Zeit.</em>
              </h1>

              {/* Ink draw line under headline */}
              <div
                className="ink-line mt-5 h-[2px] w-24 origin-left bg-primary"
                style={{ animation: "inkDraw 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s both" }}
              />

              <p
                className="ink-stage mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground"
                style={{ animation: "inkFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.45s both" }}
              >
                Chalkdust ist der Co-Pilot, den jede Lehrkraft verdient. Kein
                Chatbot, kein Template-Generator — ein Planungspartner, der deine
                Klassen kennt, sich an sie erinnert und mit der Zeit besser wird.
              </p>

              <div
                className="ink-stage mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
                style={{ animation: "inkFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s both" }}
              >
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/dashboard">Jetzt kostenlos starten</Link>
                </Button>
                <Link
                  href="#die-idee"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mehr erfahren →
                </Link>
              </div>
              <p
                className="ink-stage mt-4 text-xs text-muted-foreground"
                style={{ animation: "inkFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.75s both" }}
              >
                Keine Kreditkarte · Kostenloser Plan verfügbar
              </p>
            </div>

            {/* Right — pull quote */}
            <div
              className="ink-stage hidden flex-col justify-end pb-6 lg:flex"
              style={{ animation: "inkFadeIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.55s both" }}
            >
              <blockquote className="border-l-2 border-primary pl-6">
                <p className="font-display text-[1.35rem] italic leading-relaxed text-foreground/70">
                  &bdquo;Was mich früher Stunden gekostet hat, dauert jetzt 20&nbsp;Minuten — und der Plan ist besser.&ldquo;
                </p>
                <footer className="mt-4 text-sm text-muted-foreground">
                  — Sarah K., Biologielehrerin
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Scene — Empathy ──────────────────────────────────────────── */}
      <section id="die-idee" className="border-t px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal>
            <p className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Der Alltag
            </p>
          </ScrollReveal>
          <ScrollReveal delay={1} slow>
            <p className="font-display text-[clamp(1.6rem,3.5vw,2.4rem)] italic leading-[1.35] text-foreground/80">
              Sonntag, 21 Uhr. Die Woche beginnt morgen. Du öffnest ein leeres
              Dokument und weißt nicht genau, wo du anfangen sollst — obwohl du
              diese Klasse in- und auswendig kennst. Obwohl du weißt, was sie
              braucht. Das Problem ist nicht das Wissen.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={2} slow>
            <p className="mt-8 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] italic leading-[1.35] text-foreground/80">
              Das Problem ist die Zeit, dieses Wissen in einen Plan zu verwandeln.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <p className="mt-10 max-w-xl text-base leading-relaxed text-muted-foreground">
              Chalkdust nimmt dein akkumuliertes Wissen — den Lehrplan, das
              Tagebuch, deine Klasse — und gibt dir in Minuten zurück, wofür du
              früher Stunden gebraucht hast.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── The Loop — Philosophy ────────────────────────────────────────── */}
      <section className="border-t bg-muted/40 px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Die Idee
            </p>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Ein System, das mit dir wächst.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Chalkdust ist kein einmaliges Werkzeug. Es ist ein Kreislauf — und
              jede Runde durch diesen Kreislauf macht die nächste besser.
            </p>
          </ScrollReveal>

          {/* Loop steps */}
          <div className="mt-16 grid gap-0 sm:grid-cols-4">
            {loopSteps.map((step, i) => (
              <ScrollReveal key={step.label} delay={(i % 4) as 0 | 1 | 2 | 3 | 4} className="relative">
                {/* Connector line between steps */}
                {/* {i < loopSteps.length - 1 && (
                  <div className="absolute right-0 top-6 hidden h-px w-full translate-x-1/2 bg-border sm:block" />
                )} */}
                <div className="relative pr-8">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-display text-4xl font-bold text-primary/20 leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold">{step.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — Editorial Deep Dives ──────────────────────────────── */}
      <section id="funktionen" className="border-t px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="pb-16 pt-24 lg:pt-32">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Funktionen
            </p>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Alles, was Lehrkräfte wirklich brauchen.
            </h2>
          </ScrollReveal>

          {features.map((feature, i) => (
            <div
              key={feature.tag}
              className="border-t py-20 lg:py-28"
            >
              <ScrollReveal
                className={`grid items-start gap-12 lg:grid-cols-[3fr_2fr] ${
                  feature.flipped ? "lg:[direction:rtl]" : ""
                }`}
              >
                {/* Main content */}
                <div className={feature.flipped ? "lg:[direction:ltr]" : ""}>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {feature.tag}
                  </p>
                  <h3 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-tight tracking-tight">
                    {feature.heading}
                  </h3>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                  <div className="mt-8">
                    <Button variant="outline" asChild>
                      <Link href="/dashboard">Ausprobieren →</Link>
                    </Button>
                  </div>
                </div>

                {/* Aside — pull detail */}
                <div
                  className={`flex flex-col justify-center ${feature.flipped ? "lg:[direction:ltr]" : ""}`}
                >
                  <div className="border-l-2 border-primary/30 pl-6">
                    <p className="font-display text-lg italic leading-relaxed text-foreground/60">
                      {feature.aside}
                    </p>
                  </div>
                  {/* Decorative step number */}
                  <p className="mt-6 font-display text-[5rem] font-bold leading-none text-primary/8 select-none">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/40 px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="mb-12 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Stimmen aus der Praxis
            </p>
          </ScrollReveal>

          {/* Featured testimonial */}
          <ScrollReveal slow>
            <blockquote className="border-l-2 border-primary pl-8 lg:pl-12">
              <p className="font-display text-[clamp(1.5rem,3vw,2.2rem)] italic leading-[1.4] text-foreground/85">
                &bdquo;{testimonials[0]?.quote}&ldquo;
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <div className="h-px w-8 bg-primary/40" />
                <div>
                  <p className="text-sm font-semibold">{testimonials[0]?.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonials[0]?.role}</p>
                </div>
              </footer>
            </blockquote>
          </ScrollReveal>

          {/* Supporting testimonials */}
          <div className="mt-16 grid gap-10 sm:grid-cols-2">
            {testimonials.slice(1).map((t, i) => (
              <ScrollReveal key={t.name} delay={(i + 1) as 0 | 1 | 2 | 3 | 4}>
                <div className="border-t-2 border-primary/20 pt-6">
                  <p className="font-display text-lg italic leading-relaxed text-foreground/75">
                    &bdquo;{t.quote}&ldquo;
                  </p>
                  <footer className="mt-5">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </footer>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="preise" className="border-t px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Preise
            </p>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Einfach. Transparent.
            </h2>
            <p className="mt-3 max-w-md text-base text-muted-foreground">
              Starte kostenlos, upgrade wenn du bereit bist.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {plans.map((plan, i) => (
              <ScrollReveal
                key={plan.name}
                delay={(i) as 0 | 1 | 2 | 3 | 4}
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
                <ul className="flex-1 space-y-2.5 border-t pt-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
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
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="border-t px-4 py-24 sm:px-6 lg:py-36">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal slow>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Bereit?
            </p>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-[1.05] tracking-tight">
              Dein Wissen verdient
              <br />
              ein besseres Werkzeug.
            </h2>

            {/* Ink underline */}
            <div
              className="ink-line mt-5 h-[2px] w-16 origin-left bg-primary"
              style={{ animation: "inkDraw 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}
            />
          </ScrollReveal>

          <ScrollReveal delay={1}>
            <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
              Schließe dich Lehrkräften an, die jede Woche Stunden sparen — und
              dabei besser vorbereitet in den Unterricht gehen als je zuvor.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button size="lg" className="h-12 px-10 text-base" asChild>
                <Link href="/dashboard">Jetzt kostenlos starten</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Keine Kreditkarte · Kostenloser Plan verfügbar
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
