import { evalite } from "evalite";
import { generateText, Output } from "ai";
import { planGenerationSystemPrompt } from "@/lib/ai/prompts/plan-generation";
import { lessonPlanSchema, type LessonPlanOutput } from "@/lib/ai/schemas";
import { getEvalModel } from "@/lib/ai/eval";

interface PlanInput {
  topic: string;
  durationMinutes: number;
  grade: string;
  subject: string;
  additionalNotes?: string;
}

interface PlanExpected {
  durationMinutes: number;
  minObjectives: number;
  minPhases: number;
}

function buildUserPrompt(input: PlanInput): string {
  const lines = [
    `## Lehrerangaben`,
    `- Stundenlänge: ${input.durationMinutes} Minuten`,
    `- Thema: ${input.topic}`,
    `- Klasse / Jahrgangsstufe: ${input.grade}`,
    `- Fach: ${input.subject}`,
    input.additionalNotes ? `- Zusätzliche Hinweise: ${input.additionalNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Erstelle einen Unterrichtsplan basierend auf folgendem Kontext:\n\n${lines}`;
}

const REQUIRED_PHASES = ["Einstieg", "Erarbeitung", "Sicherung", "Abschluss"];

const VAGUE_VERBS = [
  "verstehen",
  "kennen",
  "wissen",
  "lernen",
  "begreifen",
  "nachvollziehen",
];

evalite<PlanInput, LessonPlanOutput, PlanExpected>("Plan Generation", {
  data: (): Array<{ input: PlanInput; expected: PlanExpected }> => [
    {
      input: {
        topic: "Einführung in die Bruchrechnung",
        durationMinutes: 45,
        grade: "6. Klasse",
        subject: "Mathematik",
      },
      expected: { durationMinutes: 45, minObjectives: 2, minPhases: 4 },
    },
    {
      input: {
        topic: "Fotosynthese",
        durationMinutes: 45,
        grade: "7. Klasse",
        subject: "Biologie",
        additionalNotes: "Schüler haben Vorwissen zur Zellbiologie",
      },
      expected: { durationMinutes: 45, minObjectives: 2, minPhases: 4 },
    },
    {
      input: {
        topic: "Die Weimarer Republik",
        durationMinutes: 90,
        grade: "10. Klasse",
        subject: "Geschichte",
      },
      expected: { durationMinutes: 90, minObjectives: 2, minPhases: 4 },
    },
  ],
  task: async (input) => {
    const { output } = await generateText({
      model: getEvalModel("high"),
      output: Output.object({ schema: lessonPlanSchema }),
      system: planGenerationSystemPrompt,
      prompt: buildUserPrompt(input),
    });
    return output;
  },
  scorers: [
    {
      name: "Timeline Duration Matches Request",
      description:
        "The sum of all phase durations must equal the requested lesson length (±2 min tolerance).",
      scorer: ({ input, output }) => {
        const total = output.timeline.reduce(
          (sum, phase) => sum + phase.durationMinutes,
          0,
        );
        return Math.abs(total - input.durationMinutes) <= 2 ? 1 : 0;
      },
    },
    {
      name: "Has Required Phases",
      description:
        "The lesson must include Einstieg, Erarbeitung, Sicherung, and Abschluss phases.",
      scorer: ({ output }) => {
        const phaseNames = output.timeline.map((p) => p.phase);
        const found = REQUIRED_PHASES.filter((required) =>
          phaseNames.some((name) =>
            name.toLowerCase().includes(required.toLowerCase()),
          ),
        );
        return found.length / REQUIRED_PHASES.length;
      },
    },
    {
      name: "Objectives Are Measurable",
      description:
        "Objectives must not use vague verbs like 'verstehen' or 'kennen' — they should describe observable actions.",
      scorer: ({ output }) => {
        if (output.objectives.length === 0) return 0;
        const measurable = output.objectives.filter(
          (obj) =>
            !VAGUE_VERBS.some((verb) =>
              new RegExp(`\\b${verb}\\b`).test(obj.text.toLowerCase()),
            ),
        );
        return measurable.length / output.objectives.length;
      },
    },
    {
      name: "Differentiation Is Non-Trivial",
      description:
        "Both weaker and stronger differentiation fields must contain meaningful content (>20 chars each).",
      scorer: ({ output }) => {
        const weakerOk = output.differentiation.weaker.length > 20;
        const strongerOk = output.differentiation.stronger.length > 20;
        return (Number(weakerOk) + Number(strongerOk)) / 2;
      },
    },
    {
      name: "Has Materials",
      description: "At least one material must be listed.",
      scorer: ({ output }) => (output.materials.length > 0 ? 1 : 0),
    },
  ],
});
