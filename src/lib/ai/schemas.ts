import { z } from "zod";

export const objectiveSchema = z.object({
  text: z.string().describe("Observable, measurable learning objective"),
  curriculumTopicId: z
    .string()
    .optional()
    .describe("ID of the linked curriculum topic, if applicable"),
});

export const timelinePhaseSchema = z.object({
  phase: z
    .string()
    .describe(
      "Phase name: Einstieg, Erarbeitung, Sicherung, Abschluss, or custom"
    ),
  durationMinutes: z.number().int().positive().describe("Duration in minutes"),
  description: z
    .string()
    .describe("What happens in this phase (markdown allowed)"),
  method: z
    .string()
    .describe(
      "Teaching method: Unterrichtsgespräch, Gruppenarbeit, Einzelarbeit, Partnerarbeit, etc."
    ),
});

export const differentiationSchema = z.object({
  weaker: z
    .string()
    .describe("Adaptations for students who need more support"),
  stronger: z
    .string()
    .describe("Extensions for students who need more challenge"),
});

export const materialSchema = z.object({
  title: z.string().describe("Name of the material"),
  type: z
    .string()
    .describe("Type: worksheet, physical, digital, textbook, etc."),
  description: z.string().describe("Brief description of the material"),
});

export const lessonPlanSchema = z.object({
  topic: z.string().describe("Lesson topic / Thema"),
  objectives: z
    .array(objectiveSchema)
    .min(1)
    .describe("Learning objectives / Lernziele"),
  timeline: z
    .array(timelinePhaseSchema)
    .min(1)
    .describe("Lesson timeline / Stundenablauf"),
  differentiation: differentiationSchema.describe(
    "Differentiation strategies / Differenzierung"
  ),
  materials: z
    .array(materialSchema)
    .describe("Materials needed / Materialien"),
  homework: z
    .string()
    .optional()
    .describe("Homework assignment / Hausaufgaben"),
});

export const curriculumTopicExtractionSchema = z.object({
  topics: z.array(
    z.object({
      title: z.string().describe("Topic title"),
      description: z.string().describe("Brief description of the topic"),
      competencyArea: z
        .string()
        .describe("Competency area this topic belongs to"),
    })
  ),
});

export type LessonPlanOutput = z.infer<typeof lessonPlanSchema>;
export type TimelinePhase = z.infer<typeof timelinePhaseSchema>;
export type Objective = z.infer<typeof objectiveSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Differentiation = z.infer<typeof differentiationSchema>;
export type CurriculumTopicExtraction = z.infer<
  typeof curriculumTopicExtractionSchema
>;

// Series milestone generation

export const seriesMilestoneSchema = z.object({
  title: z
    .string()
    .describe("Kurzer, prägnanter Titel des Meilensteins"),
  description: z
    .string()
    .describe(
      "Beschreibung, was in diesem Meilenstein erarbeitet wird (1–3 Sätze)"
    ),
  learningGoals: z
    .array(
      z.object({
        text: z
          .string()
          .describe("Beobachtbares, messbares Lernziel für diesen Meilenstein"),
      })
    )
    .min(1)
    .describe("Lernziele für diesen Meilenstein"),
  estimatedLessons: z
    .number()
    .int()
    .positive()
    .describe("Geschätzte Anzahl an Unterrichtsstunden für diesen Meilenstein"),
});

export const seriesGenerationSchema = z.object({
  milestones: z
    .array(seriesMilestoneSchema)
    .min(2)
    .describe(
      "Geordnete Liste der Meilensteine — progressiv aufgebaut vom Einfachen zum Komplexen"
    ),
});

export type SeriesMilestoneOutput = z.infer<typeof seriesMilestoneSchema>;
export type SeriesGenerationOutput = z.infer<typeof seriesGenerationSchema>;

// Milestone Lesson Arc generation

export const arcSlotSchema = z.object({
  position: z
    .number()
    .int()
    .positive()
    .describe("1-indexed position of this lesson slot within the milestone"),
  suggestedTopic: z
    .string()
    .describe("Concise topic/title for this lesson (max 80 chars)"),
  focusAreas: z
    .string()
    .describe(
      "Brief description of what this lesson focuses on and how it progresses toward the milestone goal (1–2 sentences)"
    ),
  goalsAddressed: z
    .array(z.object({ text: z.string() }))
    .describe(
      "Which milestone learning goals this slot primarily addresses. Can be empty if this slot is purely preparatory."
    ),
});

export const arcGenerationSchema = z.object({
  slots: z
    .array(arcSlotSchema)
    .min(1)
    .describe(
      "Ordered lesson slots — one per planned lesson in the milestone, distributed to progressively reach all milestone goals"
    ),
});

export type ArcSlotOutput = z.infer<typeof arcSlotSchema>;
export type ArcGenerationOutput = z.infer<typeof arcGenerationSchema>;

export const transitionSummarySchema = z.object({
  summary: z
    .string()
    .describe(
      "Ganzheitliche Jahresrückschau: behandelte Themen, Klassenentwicklung, bewährte Unterrichtsformen"
    ),
  strengths: z
    .string()
    .describe(
      "Bereiche, in denen die Klasse besonders gut vorangekommen ist – inhaltlich, methodisch oder in der Lernhaltung"
    ),
  weaknesses: z
    .string()
    .describe(
      "Bereiche, die im neuen Schuljahr besondere Aufmerksamkeit erfordern – Wissenslücken, Methodenschwierigkeiten, nicht ausreichend vertiefte Themen"
    ),
});

export type TransitionSummaryOutput = z.infer<typeof transitionSummarySchema>;
