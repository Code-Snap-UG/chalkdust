import { evalite } from "evalite";
import { generateText, Output } from "ai";
import { getCurriculumExtractionPrompt } from "@/lib/ai/prompts/curriculum-extraction";
import {
  curriculumTopicExtractionSchema,
  type CurriculumTopicExtraction,
} from "@/lib/ai/schemas";
import { getEvalModel } from "@/lib/ai/eval";

interface CurriculumInput {
  text: string;
  grade?: string;
  subject?: string;
}

interface CurriculumExpected {
  minTopics: number;
  maxTopics: number;
  /** Competency area keywords that must appear in at least one extracted topic */
  expectedCompetencyAreas: string[];
}

evalite<CurriculumInput, CurriculumTopicExtraction, CurriculumExpected>(
  "Lehrplan Extraction",
  {
    data: (): Array<{ input: CurriculumInput; expected: CurriculumExpected }> => [
      {
        input: {
          text: `Lehrplan Mathematik – Jahrgangsstufe 5/6

Leitidee Zahlen und Operationen
Die Schülerinnen und Schüler lernen natürliche Zahlen, ganze Zahlen und einfache Brüche kennen und rechnen damit.
Thema 1: Natürliche Zahlen und das Stellenwertsystem
Thema 2: Grundrechenarten mit natürlichen Zahlen
Thema 3: Einführung in die Bruchrechnung – Brüche benennen und darstellen
Thema 4: Dezimalzahlen und ihre Anwendung

Leitidee Raum und Form
Die Schülerinnen und Schüler untersuchen geometrische Grundformen und deren Eigenschaften.
Thema 5: Dreiecke und Vierecke – Eigenschaften und Klassifikation
Thema 6: Flächeninhalt und Umfang
Thema 7: Körper – Würfel, Quader und Zylinder

Leitidee Daten und Zufall
Thema 8: Daten erheben, darstellen und interpretieren (Diagramme, Häufigkeitstabellen)
Thema 9: Grundbegriffe der Wahrscheinlichkeit`,
          grade: "5",
          subject: "Mathematik",
        },
        expected: {
          minTopics: 6,
          maxTopics: 12,
          expectedCompetencyAreas: ["Zahlen", "Raum", "Daten"],
        },
      },
      {
        input: {
          text: `Lehrplan Deutsch – Jahrgangsstufe 7/8

Kompetenzbereich Sprechen und Zuhören
Thema 1: Argumentieren und Diskutieren – Standpunkte begründen und vertreten
Thema 2: Präsentieren – Informationen strukturiert und adressatengerecht vortragen
Thema 3: Aktives Zuhören und Gesprächsführung

Kompetenzbereich Schreiben
Thema 4: Erörterung schreiben – These, Argument, Beispiel
Thema 5: Kreatives Schreiben – Kurzgeschichten und Erzählungen
Thema 6: Bewerbungsschreiben und formelle Briefe

Kompetenzbereich Lesen und Umgang mit Texten
Thema 7: Sachtexte analysieren und auswerten
Thema 8: Literarische Texte interpretieren – Kurzgeschichten

Kompetenzbereich Sprache untersuchen
Thema 9: Satzstrukturen und Satzglieder
Thema 10: Wortarten und ihre Funktionen`,
          grade: "7",
          subject: "Deutsch",
        },
        expected: {
          minTopics: 7,
          maxTopics: 13,
          expectedCompetencyAreas: ["Sprechen", "Schreiben", "Lesen"],
        },
      },
    ],
    task: async (input) => {
      const { output } = await generateText({
        model: getEvalModel("fast"),
        output: Output.object({ schema: curriculumTopicExtractionSchema }),
        system: getCurriculumExtractionPrompt(input.grade, input.subject),
        prompt: input.text,
      });
      return output;
    },
    scorers: [
      {
        name: "Topic Count In Range",
        description:
          "The number of extracted topics must fall within the expected min/max range.",
        scorer: ({ output, expected }) => {
          if (!expected) return 0;
          const count = output.topics.length;
          return count >= expected.minTopics && count <= expected.maxTopics ? 1 : 0;
        },
      },
      {
        name: "All Topics Have Competency Area",
        description: "Every extracted topic must have a non-empty competency area.",
        scorer: ({ output }) => {
          if (output.topics.length === 0) return 0;
          const withArea = output.topics.filter(
            (t) => t.competencyArea && t.competencyArea.trim().length > 0,
          );
          return withArea.length / output.topics.length;
        },
      },
      {
        name: "Expected Competency Areas Covered",
        description:
          "All expected competency area keywords must appear in at least one extracted topic.",
        scorer: ({ output, expected }) => {
          if (!expected || expected.expectedCompetencyAreas.length === 0) return 1;
          const found = expected.expectedCompetencyAreas.filter((keyword) =>
            output.topics.some((t) =>
              t.competencyArea.toLowerCase().includes(keyword.toLowerCase()),
            ),
          );
          return found.length / expected.expectedCompetencyAreas.length;
        },
      },
      {
        name: "Topics Have Descriptions",
        description: "Every extracted topic must have a non-empty description.",
        scorer: ({ output }) => {
          if (output.topics.length === 0) return 0;
          const withDesc = output.topics.filter(
            (t) => t.description && t.description.trim().length > 10,
          );
          return withDesc.length / output.topics.length;
        },
      },
    ],
  },
);
