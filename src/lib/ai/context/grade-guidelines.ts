/**
 * Parses a grade string (e.g. "5", "10", "Klasse 7", "Q1", "EF") into a
 * numeric grade level. Returns null when the grade cannot be parsed.
 */
function parseGradeLevel(grade: string): number | null {
  const trimmed = grade.trim().toLowerCase();

  // Oberstufe qualifications (German Gymnasium)
  if (trimmed === "ef" || trimmed === "einführungsphase") return 10;
  if (trimmed === "q1") return 11;
  if (trimmed === "q2") return 12;

  // Strip common prefixes: "klasse", "kl.", "jahrgang", "jg."
  const stripped = trimmed
    .replace(/^(klasse|kl\.|jahrgang|jg\.)\s*/, "")
    .trim();
  const n = parseInt(stripped, 10);
  return isNaN(n) ? null : n;
}

/**
 * Returns a paragraph of pedagogical guidance tailored to the class grade.
 * The returned string is intended to be injected directly into the AI context.
 * Returns null when the grade is unknown or unrecognised.
 */
export function buildGradeGuidelines(grade: string): string | null {
  const level = parseGradeLevel(grade);
  if (level === null) return null;

  if (level <= 6) {
    return `## Klassenstufe ${grade} — Pädagogische Hinweise

Die Klasse befindet sich in der Unterstufe (Jahrgang ${grade}). Berücksichtige beim Planen:
- **Spielerische Einstiege** funktionieren sehr gut — Kennenlernspiele, Bewegungsspiele und spielbasierte Aktivitäten sind altersgerecht und motivierend.
- **Kurze Aufmerksamkeitsspanne**: Wechsle Methoden und Sozialformen häufig (alle 10–15 Minuten). Vermeide lange Lehrerphasen ohne Schüleraktivierung.
- **Klare Strukturen und Rituale** geben Sicherheit — Stundeneinstieg und -abschluss klar kennzeichnen.
- **Visualisierungen und Handeln**: Konkrete Materialien, Bilder und körperliche Aktivitäten vor abstrakten Konzepten.
- **Positive Verstärkung** wirkt stark — explizites Loben und ermutigende Rückmeldungen einplanen.
- **Gruppenarbeiten** kurz halten und gut strukturieren, da selbstständiges Arbeiten noch im Aufbau ist.`;
  }

  if (level <= 8) {
    return `## Klassenstufe ${grade} — Pädagogische Hinweise

Die Klasse befindet sich in der Mittelstufe (Jahrgang ${grade}). Berücksichtige beim Planen:
- **Spielerische Einstiege** können noch wirken, sollten aber nicht kindlich wirken — bevorzuge aktivierende Rätsel, Quizformate oder Diskussionseinstiege.
- **Peer-Learning** gewinnt an Bedeutung — kooperative Methoden (Think-Pair-Share, Gruppenpuzzle) sind effektiv.
- **Selbstständigkeit aufbauen**: Schrittweise längere Arbeitsphasen einführen, aber weiterhin klare Aufgabenstellung geben.
- **Abwechslung wichtig**: Monotonie vermeiden, Methodenmix sicherstellen.
- **Leistungsdifferenzierung** beachten — in dieser Stufe treten Unterschiede im Lerntempo und -niveau deutlicher hervor.
- Themen mit Alltagsbezug oder sozialer Relevanz steigern die intrinsische Motivation.`;
  }

  if (level <= 10) {
    return `## Klassenstufe ${grade} — Pädagogische Hinweise

Die Klasse befindet sich in der oberen Mittelstufe bzw. Einführungsphase (Jahrgang ${grade}). Berücksichtige beim Planen:
- **Spielerische Einstiege wirken oft aufgesetzt** in dieser Stufe — bevorzuge sachliche, problemorientierte oder provokante Einstiege (These, Dilemma, Fallbeispiel).
- **Selbstständiges Arbeiten** kann länger und anspruchsvoller sein — Schülerinnen und Schüler können zunehmend eigenverantwortlich planen.
- **Diskussion und Argumentation** sind wertvolle Methoden — Raum für kontroverse Auseinandersetzung mit dem Stoff lassen.
- **Abstraktes Denken** ist entwickelt — Konzepte können theoretischer und weniger konkret eingeführt werden.
- **Prüfungsvorbereitung** kann als Rahmung dienen, aber nicht alleinige Motivation sein.
- Motivationslagen sind heterogener — persönliche Relevanz des Themas herausarbeiten.`;
  }

  // level >= 11 → Oberstufe
  return `## Klassenstufe ${grade} — Pädagogische Hinweise

Die Klasse befindet sich in der Oberstufe (Jahrgang ${grade}). Berücksichtige beim Planen:
- **Spielerische oder aufwärmende Einstiege sind unpassend** — Oberstufenschülerinnen und -schüler erwarten sachlichen, intellektuell stimulierenden Unterricht. Direkt ins Thema einsteigen.
- **Wissenschaftspropädeutisches Arbeiten**: Quellenarbeit, Argumentation, Hypothesenbildung und methodenbewusstes Vorgehen fördern.
- **Selbstständige und projektorientierte Phasen** sind gut geeignet — Eigenverantwortung und Zeitmanagement fordern und fördern.
- **Tiefe statt Breite**: Lieber ein Konzept gründlich durchdringen als viele Themen oberflächlich behandeln.
- **Abiturrelevanz** ist ein realer Motivationsfaktor — transparenter Bezug zum Prüfungsformat und den Anforderungen.
- **Diskurs auf Augenhöhe**: Sachliche Diskussionen, eigene Positionen vertreten und hinterfragen lassen.
- Schülerinnen und Schüler können und sollen Unterrichtsphasen aktiv mitgestalten (Referate, Präsentationen, Expertenpuzzle).`;
}
