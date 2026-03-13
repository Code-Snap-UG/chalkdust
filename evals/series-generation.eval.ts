import { evalite } from "evalite";
import { generateText, Output } from "ai";
import { seriesGenerationSystemPrompt } from "@/lib/ai/prompts/series-generation";
import {
  seriesGenerationSchema,
  type SeriesGenerationOutput,
} from "@/lib/ai/schemas";
import { getEvalModel } from "@/lib/ai/eval";

interface SeriesInput {
  title: string;
  description: string;
  estimatedLessons: number;
  grade: string;
  subject: string;
  additionalNotes?: string;
}

interface SeriesExpected {
  minMilestones: number;
  maxMilestones: number;
  estimatedLessons: number;
}

function buildUserPrompt(input: SeriesInput): string {
  const lines = [
    `## Reihendetails`,
    `- Titel: ${input.title}`,
    `- Ziel: ${input.description}`,
    `- Geschätzte Stunden gesamt: ${input.estimatedLessons}`,
    `- Klasse: ${input.grade}`,
    `- Fach: ${input.subject}`,
    input.additionalNotes
      ? `- Zusätzliche Hinweise: ${input.additionalNotes}`
      : null,
    `\nErstelle eine sinnvolle Abfolge von Meilensteinen, die progressiv zum Ziel führen. Die Summe der geschätzten Stunden pro Meilenstein sollte ungefähr ${input.estimatedLessons} ergeben.`,
  ]
    .filter(Boolean)
    .join("\n");

  return `Erstelle eine Reihenplanung mit Meilensteinen basierend auf folgenden Angaben:\n\n${lines}`;
}

const VAGUE_VERBS = [
  "verstehen",
  "kennen",
  "wissen",
  "lernen",
  "begreifen",
  "nachvollziehen",
];

evalite<SeriesInput, SeriesGenerationOutput, SeriesExpected>(
  "Series Generation",
  {
    data: (): Array<{ input: SeriesInput; expected: SeriesExpected }> => [
      {
        input: {
          title: "Märchen und Fabeln – epische Kleinformen entdecken",
          description:
            "SuS können Märchen und Fabeln lesen, deren typische Merkmale benennen und eine eigene kurze Fabel verfassen",
          estimatedLessons: 12,
          grade: "5. Klasse",
          subject: "Deutsch",
          additionalNotes:
            "Inhalte aus dem Lehrplan 5/6: epische Kleinformen (Märchen, Fabeln), Figurenkonstellation, Konfliktverlauf, kreatives Schreiben mit Erzählstruktur",
        },
        expected: {
          minMilestones: 3,
          maxMilestones: 6,
          estimatedLessons: 12,
        },
      },
      {
        input: {
          title: "Lineare Funktionen",
          description:
            "SuS können lineare Funktionen erkennen, darstellen und anwenden",
          estimatedLessons: 10,
          grade: "8. Klasse",
          subject: "Mathematik",
          additionalNotes: "Vorwissen: Koordinatensystem und proportionale Zuordnungen",
        },
        expected: {
          minMilestones: 3,
          maxMilestones: 6,
          estimatedLessons: 10,
        },
      },
      {
        input: {
          title: "Kurzgeschichten analysieren und verfassen",
          description:
            "SuS können Kurzgeschichten analysieren, Merkmale erkennen und eine eigene Kurzgeschichte verfassen",
          estimatedLessons: 6,
          grade: "9. Klasse",
          subject: "Deutsch",
        },
        expected: {
          minMilestones: 2,
          maxMilestones: 5,
          estimatedLessons: 6,
        },
      },
    ],

    task: async (input) => {
      const { output } = await generateText({
        model: getEvalModel("high"),
        output: Output.object({ schema: seriesGenerationSchema }),
        system: seriesGenerationSystemPrompt,
        prompt: buildUserPrompt(input),
      });
      return output;
    },

    scorers: [
      {
        name: "Milestone Count in Range",
        description:
          "The number of milestones should be within a reasonable range for the topic duration.",
        scorer: ({ output, expected }) => {
          const count = output.milestones.length;
          return count >= expected.minMilestones &&
            count <= expected.maxMilestones
            ? 1
            : 0;
        },
      },
      {
        name: "Estimated Lessons Sum Matches",
        description:
          "The sum of estimated lessons per milestone should approximately match the total (±20% tolerance).",
        scorer: ({ output, expected }) => {
          const total = output.milestones.reduce(
            (sum, m) => sum + m.estimatedLessons,
            0
          );
          const tolerance = expected.estimatedLessons * 0.2;
          return Math.abs(total - expected.estimatedLessons) <= tolerance
            ? 1
            : 0;
        },
      },
      {
        name: "All Milestones Have Learning Goals",
        description:
          "Every milestone must have at least one learning goal.",
        scorer: ({ output }) => {
          const withGoals = output.milestones.filter(
            (m) => m.learningGoals.length > 0
          );
          return withGoals.length / output.milestones.length;
        },
      },
      {
        name: "Learning Goals Are Measurable",
        description:
          "Learning goals should not use vague verbs — they should describe observable actions.",
        scorer: ({ output }) => {
          const allGoals = output.milestones.flatMap((m) => m.learningGoals);
          if (allGoals.length === 0) return 0;
          const measurable = allGoals.filter(
            (g) =>
              !VAGUE_VERBS.some((verb) =>
                new RegExp(`\\b${verb}\\b`).test(g.text.toLowerCase())
              )
          );
          return measurable.length / allGoals.length;
        },
      },
      {
        name: "Progressive Complexity",
        description:
          "Milestone titles and descriptions should indicate progressive complexity (first milestones should reference basics/introduction, later ones application/transfer).",
        scorer: ({ output }) => {
          if (output.milestones.length < 2) return 0;

          const first = (
            output.milestones[0].title +
            " " +
            output.milestones[0].description
          ).toLowerCase();
          const last = (
            output.milestones[output.milestones.length - 1].title +
            " " +
            output.milestones[output.milestones.length - 1].description
          ).toLowerCase();

          const introTerms = [
            "einführung",
            "grundlagen",
            "kennenlernen",
            "erste",
            "was ist",
            "definition",
            "erkennen",
            "einfach",
          ];
          const advancedTerms = [
            "anwend",
            "transfer",
            "durchführ",
            "verfass",
            "eigen",
            "komplex",
            "vertiefung",
            "projekt",
            "präsent",
            "selbständig",
          ];

          const firstHasIntro = introTerms.some((t) => first.includes(t));
          const lastHasAdvanced = advancedTerms.some((t) => last.includes(t));

          return (Number(firstHasIntro) + Number(lastHasAdvanced)) / 2;
        },
      },
      {
        name: "All Milestones Have Descriptions",
        description:
          "Every milestone must have a non-trivial description (>20 chars).",
        scorer: ({ output }) => {
          const withDesc = output.milestones.filter(
            (m) => m.description && m.description.length > 20
          );
          return withDesc.length / output.milestones.length;
        },
      },
    ],
  }
);
