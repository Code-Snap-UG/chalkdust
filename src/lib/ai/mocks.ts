import type { AgentMode } from "./trace";
import type {
  LessonPlanOutput,
  CurriculumTopicExtraction,
  TransitionSummaryOutput,
  SeriesGenerationOutput,
} from "./schemas";

export const AI_MOCK_ENABLED = process.env.AI_MOCK === "true";

export const MOCK_CHAT_RESPONSE =
  "[Mock-Modus] Ich bin im Mock-Modus und mache keine echten LLM-Anfragen. " +
  "Setze AI_MOCK=false in .env.local, um echte Antworten zu erhalten.";

const mockLessonPlan: LessonPlanOutput = {
  topic: "[Mock] Einführung in die Märchenanalyse",
  objectives: [
    {
      text: "Die Schülerinnen und Schüler können typische Merkmale eines Märchens benennen und am Text belegen.",
    },
    {
      text: "Die Schülerinnen und Schüler können Figurenkonstellation und Konfliktverlauf einer Märchenhandlung beschreiben.",
    },
  ],
  timeline: [
    {
      phase: "Einstieg",
      durationMinutes: 10,
      description:
        "Aktivierung des Vorwissens: Was ist ein Märchen? Schülerinnen und Schüler sammeln Merkmale aus bekannten Märchen. Leitfrage: Woran erkennt man ein Märchen?",
      method: "Unterrichtsgespräch",
    },
    {
      phase: "Erarbeitung",
      durationMinutes: 20,
      description:
        'Stilles Lesen von „Rotkäppchen" (Grimm). Anschließend markieren die SuS typische Märchenmerkmale im Text anhand eines Arbeitsblatts (Gut vs. Böse, Magie, Dreizahl, offener Anfang).',
      method: "Einzelarbeit",
    },
    {
      phase: "Sicherung",
      durationMinutes: 10,
      description:
        "Besprechung der Ergebnisse im Plenum. Gemeinsame Erstellung eines Tafelbildes mit den typischen Merkmalen des Märchens.",
      method: "Unterrichtsgespräch",
    },
    {
      phase: "Abschluss",
      durationMinutes: 5,
      description:
        "Zusammenfassung der erarbeiteten Merkmale. Ausblick: Vergleich mit einer Fabel in der nächsten Stunde.",
      method: "Unterrichtsgespräch",
    },
  ],
  differentiation: {
    weaker:
      "Vorlese-Version des Märchentextes; Merkmalsliste zum Abhaken statt freier Textarbeit.",
    stronger:
      "Vergleich zweier Märchenversionen (Grimm vs. Andersen): Gemeinsamkeiten und Unterschiede in einer Tabelle festhalten.",
  },
  materials: [
    {
      title: 'Märchentext „Rotkäppchen"',
      type: "worksheet",
      description:
        "Lesetext mit Aufgaben zur Merkmalsanalyse (Figurenkonstellation, Konfliktverlauf, typische Formeln).",
    },
    {
      title: "Tafelbild: Merkmale des Märchens",
      type: "digital",
      description:
        "Digitale Folie mit Strukturierung der typischen Märchenmerkmale als Sicherungsbild.",
    },
  ],
  homework:
    "Suche ein weiteres Märchen und notiere drei typische Merkmale mit Textstelle.",
};

const mockCurriculumTopics: CurriculumTopicExtraction = {
  topics: [
    {
      title: "[Mock] Epische Kleinformen",
      description:
        "Lesen und Analysieren von Märchen, Fabeln, Lokalsagen und Abenteuergeschichten; Merkmale epischer Kleinformen erkennen und benennen.",
      competencyArea: "Sich mit Texten und Medien auseinandersetzen",
    },
    {
      title: "[Mock] Lyrik: Natur- und Jahreszeitengedichte",
      description:
        "Begegnung mit Gedichten zu Natur und Jahreszeiten; Analyse von Thema, Aufbau, lyrischer Sprecherin/lyrischem Sprecher, Reimstruktur und Rhythmus.",
      competencyArea: "Sich mit Texten und Medien auseinandersetzen",
    },
    {
      title: "[Mock] Wortarten und Satzstrukturen",
      description:
        "Wortarten in ihrer Funktionalität (Substantiv, Verb, Adjektiv, Pronomen, Konjunktion, Präposition); Satzglieder (Subjekt, Prädikat, Objekt) und grammatische Proben.",
      competencyArea: "Sprache und Sprachgebrauch untersuchen",
    },
  ],
};

const mockTransitionSummary: TransitionSummaryOutput = {
  summary:
    "[Mock] Die Klasse hat im vergangenen Schuljahr epische Kleinformen (Märchen, Fabeln, Sagen) gelesen und analysiert sowie erste eigene Erzähltexte verfasst. " +
    "Kooperative Schreibphasen und das Lesen im Plenum haben sich als motivierende Unterrichtsformen bewährt. " +
    "Das Arbeitstempo war überwiegend angemessen, mit gelegentlichen Verzögerungen bei schriftlichen Aufgaben.",
  strengths:
    "[Mock] Besonders stark war die Klasse beim mündlichen Erzählen und bei der kreativen Textproduktion. " +
    "Die Lesefreude und Beteiligung am Unterrichtsgespräch über Texte waren durchgehend hoch.",
  weaknesses:
    "[Mock] Schwächen zeigten sich bei der sicheren Anwendung von Wortarten und Satzstrukturen sowie bei der Großschreibung nominalisierter Verben und Adjektive. " +
    "Das Verfassen strukturierter Erzähltexte mit klarem Spannungsaufbau sollte im neuen Schuljahr weiter geübt werden.",
};

const mockSeriesGeneration: SeriesGenerationOutput = {
  milestones: [
    {
      title: "[Mock] Märchen kennenlernen und Merkmale erarbeiten",
      description:
        "Einstieg in epische Kleinformen. Die SuS lesen Märchen (z.B. Grimm), aktivieren Vorwissen und erarbeiten typische Märchenmerkmale (Gut vs. Böse, Magie, Dreizahl, typische Formeln).",
      learningGoals: [
        {
          text: "Die SuS können typische Merkmale eines Märchens benennen und am Text belegen.",
        },
        {
          text: "Die SuS können Figurenkonstellation und Konfliktverlauf einer Märchenhandlung beschreiben.",
        },
      ],
      estimatedLessons: 2,
    },
    {
      title: "[Mock] Fabeln lesen und mit Märchen vergleichen",
      description:
        "Begegnung mit Fabeln (z.B. Äsop). Vergleich von Märchen und Fabeln: Gemeinsamkeiten und Unterschiede. Erarbeitung der Lehre/Moral in Fabeln.",
      learningGoals: [
        {
          text: "Die SuS können Märchen und Fabeln anhand von Merkmalen unterscheiden.",
        },
        {
          text: "Die SuS können die Lehre einer Fabel benennen und begründen.",
        },
      ],
      estimatedLessons: 3,
    },
    {
      title: "[Mock] Eigene Texte verfassen und präsentieren",
      description:
        "Kreative Schreibphase: SuS verfassen eigene kurze Märchen oder Fabeln. Präsentation und Feedback im Plenum. Sicherung der erarbeiteten Merkmale epischer Kleinformen.",
      learningGoals: [
        {
          text: "Die SuS können eine kurze eigene Märchen- oder Fabelerzählung mit typischen Merkmalen verfassen.",
        },
        {
          text: "Die SuS können ihre Texte strukturiert vorlesen und Rückmeldung geben.",
        },
      ],
      estimatedLessons: 3,
    },
  ],
};

export function getMockObject(agentMode: AgentMode): unknown {
  switch (agentMode) {
    case "plan_generation":
      return mockLessonPlan;
    case "curriculum_extraction":
      return mockCurriculumTopics;
    case "transition_summary":
      return mockTransitionSummary;
    case "series_generation":
      return mockSeriesGeneration;
    case "plan_refinement":
      return { text: MOCK_CHAT_RESPONSE };
  }
}
