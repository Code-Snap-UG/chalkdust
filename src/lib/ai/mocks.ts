import type { AgentMode } from "./trace";
import type {
  LessonPlanOutput,
  CurriculumTopicExtraction,
  TransitionSummaryOutput,
} from "./schemas";

export const AI_MOCK_ENABLED = process.env.AI_MOCK === "true";

export const MOCK_CHAT_RESPONSE =
  "[Mock-Modus] Ich bin im Mock-Modus und mache keine echten LLM-Anfragen. " +
  "Setze AI_MOCK=false in .env.local, um echte Antworten zu erhalten.";

const mockLessonPlan: LessonPlanOutput = {
  topic: "[Mock] Einführung in die Photosynthese",
  objectives: [
    {
      text: "Die Schülerinnen und Schüler können den Prozess der Photosynthese in eigenen Worten erklären.",
    },
    {
      text: "Die Schülerinnen und Schüler können die Gleichung der Photosynthese aufschreiben und erläutern.",
    },
  ],
  timeline: [
    {
      phase: "Einstieg",
      durationMinutes: 10,
      description:
        "Aktivierung des Vorwissens durch ein Bild eines Waldes im Sonnenlicht. Leitfrage: Wie ernähren sich Pflanzen?",
      method: "Unterrichtsgespräch",
    },
    {
      phase: "Erarbeitung",
      durationMinutes: 20,
      description:
        "Erarbeitung des Prozesses der Photosynthese anhand eines Lückentexts und einer Schemazeichnung.",
      method: "Einzelarbeit",
    },
    {
      phase: "Sicherung",
      durationMinutes: 10,
      description:
        "Gemeinsames Besprechen und Korrigieren der Ergebnisse. Schüler stellen ihre Antworten vor.",
      method: "Unterrichtsgespräch",
    },
    {
      phase: "Abschluss",
      durationMinutes: 5,
      description:
        "Zusammenfassung der Kernaussagen, Wiederholung der Gleichung, Ausblick auf die nächste Stunde.",
      method: "Unterrichtsgespräch",
    },
  ],
  differentiation: {
    weaker:
      "Vereinfachter Lückentext mit Wortliste; Schemazeichnung mit beschrifteten Pfeilen als Hilfe.",
    stronger:
      "Zusatzaufgabe: Vergleich von Photosynthese und Zellatmung in einer Tabelle.",
  },
  materials: [
    {
      title: "Lückentext Photosynthese",
      type: "worksheet",
      description: "Arbeitsblatt zur Erarbeitung des Photosyntheseprozesses.",
    },
    {
      title: "Schemazeichnung Chloroplast",
      type: "digital",
      description: "Digitale Abbildung eines Chloroplasten mit Beschriftungen.",
    },
  ],
  homework: "Lernzettel zur Photosynthese-Gleichung für die nächste Stunde.",
};

const mockCurriculumTopics: CurriculumTopicExtraction = {
  topics: [
    {
      title: "[Mock] Zellbiologie",
      description: "Aufbau und Funktion tierischer und pflanzlicher Zellen.",
      competencyArea: "Fachwissen",
    },
    {
      title: "[Mock] Photosynthese",
      description:
        "Prozess der Photosynthese, Licht- und Dunkelreaktionen, Bedeutung für Ökosysteme.",
      competencyArea: "Fachwissen",
    },
    {
      title: "[Mock] Genetik",
      description:
        "Grundlagen der Vererbungslehre, Mendel'sche Regeln, DNA-Struktur.",
      competencyArea: "Fachwissen",
    },
  ],
};

const mockTransitionSummary: TransitionSummaryOutput = {
  summary:
    "[Mock] Die Klasse hat im vergangenen Schuljahr die Grundlagen der Zellbiologie und Genetik erarbeitet. " +
    "Gruppenarbeiten und kooperative Lernformen haben sich bewährt. Das Arbeitstempo war insgesamt gut, " +
    "mit einigen Verzögerungen bei mathematisch-analytischen Aufgaben.",
  strengths:
    "[Mock] Besonders stark war die Klasse in schriftlichen Ausarbeitungen und bei Präsentationsaufgaben. " +
    "Die Motivation für experimentelle Phasen war durchgehend hoch.",
  weaknesses:
    "[Mock] Schwächen zeigten sich bei der eigenständigen Interpretation von Diagrammen und Graphen. " +
    "Das Thema Zellatmung wurde aus Zeitgründen nur oberflächlich behandelt und sollte im neuen Schuljahr vertieft werden.",
};

export function getMockObject(agentMode: AgentMode): unknown {
  switch (agentMode) {
    case "plan_generation":
      return mockLessonPlan;
    case "curriculum_extraction":
      return mockCurriculumTopics;
    case "transition_summary":
      return mockTransitionSummary;
    case "plan_refinement":
      return { text: MOCK_CHAT_RESPONSE };
  }
}
