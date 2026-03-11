import { evalite } from "evalite";
import { generateText, Output } from "ai";
import {
  transitionSummarySystemPrompt,
  buildTransitionSummaryPrompt,
} from "@/lib/ai/prompts/transition-summary";
import {
  transitionSummarySchema,
  type TransitionSummaryOutput,
} from "@/lib/ai/schemas";
import { getEvalModel } from "@/lib/ai/eval";

interface TransitionInput {
  className: string;
  subject: string;
  grade: string;
  schoolYear: string;
  diaryText: string;
}

interface TransitionExpected {
  /** Keywords that must appear somewhere in the output (summary + strengths + weaknesses) */
  mustMentionKeywords: string[];
  minFieldLength: number;
}

evalite<TransitionInput, TransitionSummaryOutput, TransitionExpected>(
  "Transition Summary",
  {
    data: (): Array<{ input: TransitionInput; expected: TransitionExpected }> => [
      {
        input: {
          className: "7b",
          subject: "Biologie",
          grade: "7. Klasse",
          schoolYear: "2024/2025",
          diaryText: `
15.09.2024 – Zellbiologie: Einstieg mit Mikroskopierübung. Schüler sehr motiviert, Gruppenarbeit hat gut funktioniert. Einige hatten Schwierigkeiten mit der korrekten Bedienung des Mikroskops.
02.10.2024 – Fotosynthese: Lückentext und Schemazeichnung. Leistungsstarke Gruppe hat Zusatzaufgabe bearbeitet. Schwächere Schüler benötigten mehr Zeit.
18.10.2024 – Zellatmung: Konnte nur angerissen werden – zu wenig Zeit. Thema muss im neuen Jahr vertieft werden.
12.11.2024 – Genetik Grundlagen: Mendel'sche Regeln. Klasse hat das Thema gut aufgenommen, Kreuzungsschema wurde von fast allen korrekt ausgefüllt.
05.12.2024 – Genetik Vertiefung: Dihybride Kreuzungen. Hoher Schwierigkeitsgrad, viele Schüler überfordert. Zusätzliche Übungsaufgaben wurden gestellt.
20.01.2025 – Ökologie: Nahrungsketten und Nahrungsnetze. Sehr gute Beteiligung beim Unterrichtsgespräch. Schüler konnten Beispiele aus ihrem Alltag nennen.
10.02.2025 – Ökologie Vertiefung: Energiefluss und Stoffkreisläufe. Abschluss mit Lernplakat in Gruppenarbeit – hervorragende Ergebnisse.
          `.trim(),
        },
        expected: {
          mustMentionKeywords: ["Zellbiologie", "Fotosynthese", "Genetik", "Ökologie"],
          minFieldLength: 80,
        },
      },
      {
        input: {
          className: "5a",
          subject: "Mathematik",
          grade: "5. Klasse",
          schoolYear: "2024/2025",
          diaryText: `
10.09.2024 – Natürliche Zahlen: Stellenwertsystem bis Milliarden. Klasse hat das Thema schnell verstanden. Einige Schüler zeigen starke Rechenfähigkeiten.
24.09.2024 – Grundrechenarten: Schriftliche Addition und Subtraktion. Mehrere Schüler haben noch Probleme mit dem Übertrag.
15.10.2024 – Multiplikation und Division: Schriftliche Verfahren. Tempo der Klasse sehr unterschiedlich – Lernspanne groß.
05.11.2024 – Bruchrechnung Einführung: Brüche benennen und darstellen. Visualisierungen mit Pizzamodell sehr hilfreich, Konzept wurde gut verstanden.
19.11.2024 – Dezimalzahlen: Umrechnung und Grundrechnen. Verwechslung von Komma-Stellenwerten häufiges Fehler. Muss weiter geübt werden.
10.12.2024 – Geometrie: Dreiecke und ihre Eigenschaften. Klasse hat Spaß am Zeichnen mit Geodreieck. Konstruktionsaufgaben gut gelöst.
14.01.2025 – Flächen und Umfang: Berechnung von Rechteck und Quadrat. Formeln wurden gut gelernt, Anwendungsaufgaben bereiteten mehr Mühe.
          `.trim(),
        },
        expected: {
          mustMentionKeywords: ["Bruchrechnung", "Dezimalzahlen", "Geometrie"],
          minFieldLength: 80,
        },
      },
    ],
    task: async (input) => {
      const { output } = await generateText({
        model: getEvalModel("high"),
        output: Output.object({ schema: transitionSummarySchema }),
        system: transitionSummarySystemPrompt,
        prompt: buildTransitionSummaryPrompt(
          input.className,
          input.subject,
          input.grade,
          input.schoolYear,
          input.diaryText,
        ),
      });
      return output;
    },
    scorers: [
      {
        name: "All Fields Non-Trivial",
        description:
          "summary, strengths, and weaknesses must each exceed the minimum character threshold.",
        scorer: ({ output, expected }) => {
          if (!expected) return 0;
          const fields = [output.summary, output.strengths, output.weaknesses];
          const passing = fields.filter(
            (f) => f && f.trim().length >= expected.minFieldLength,
          );
          return passing.length / fields.length;
        },
      },
      {
        name: "Key Topics Mentioned",
        description:
          "Topics covered in the diary entries must be reflected in the output.",
        scorer: ({ output, expected }) => {
          if (!expected || expected.mustMentionKeywords.length === 0) return 1;
          const fullText = [
            output.summary,
            output.strengths,
            output.weaknesses,
          ].join(" ");
          const found = expected.mustMentionKeywords.filter((kw) =>
            fullText.toLowerCase().includes(kw.toLowerCase()),
          );
          return found.length / expected.mustMentionKeywords.length;
        },
      },
      {
        name: "Weaknesses Mention Improvement Areas",
        description:
          "The weaknesses field should indicate areas needing attention in the next school year.",
        scorer: ({ output }) => {
          const improvementKeywords = [
            "vertieft",
            "verbessert",
            "geübt",
            "aufmerksamkeit",
            "schwierigkeit",
            "nachholbedarf",
            "förderung",
            "neue",
            "nächste",
          ];
          const text = output.weaknesses.toLowerCase();
          const found = improvementKeywords.filter((kw) => text.includes(kw));
          return found.length >= 2 ? 1 : found.length / 2;
        },
      },
    ],
  },
);
