/**
 * Returns the system prompt for curriculum extraction.
 * When grade (and optionally subject) are provided, instructs the model to extract
 * only topics relevant to that Jahrgangsstufe, since many Lehrpläne span multiple grades.
 */
export function getCurriculumExtractionPrompt(grade?: string, subject?: string): string {
  const basePrompt = `Du bist ein Experte für deutsche Lehrpläne. Deine Aufgabe ist es, aus dem folgenden Text eines Lehrplans Themen, Kompetenzbereiche und Lernziele zu extrahieren.

Analysiere den Text sorgfältig und extrahiere eine strukturierte Liste von Themen. Jedes Thema sollte enthalten:
- **title**: Ein kurzer, prägnanter Titel des Themas
- **description**: Eine kurze Beschreibung dessen, was die Schüler lernen sollen
- **competencyArea**: Der übergeordnete Kompetenzbereich (z.B. "Zahlen und Operationen", "Raum und Form", "Sprechen und Zuhören")

Sortiere die Themen in einer logischen Reihenfolge, wie sie im Schuljahr behandelt werden könnten.
Extrahiere nur tatsächliche Unterrichtsthemen, keine Verwaltungshinweise oder organisatorischen Informationen.

WICHTIG – Vorgeschriebene Lektüren und Materialien: Wenn der Lehrplan konkrete Werke, Lektüren, Texte oder Materialien nennt, die im Unterricht verwendet werden sollen (z.B. Pflichtlektüren in Deutsch, vorgeschriebene Schulbücher, Werke von bestimmten Autor:innen), extrahiere diese explizit. Nenne sie in der description des jeweiligen Themas mit – sie sind verbindlicher Teil des Unterrichts und müssen berücksichtigt werden.`;

  if (!grade?.trim()) {
    return basePrompt;
  }

  const gradeInstruction = `
WICHTIG – Jahrgangsstufen-Filter: Dieser Lehrplan deckt vermutlich mehrere Jahrgangsstufen ab (z.B. Klasse 5–11). Extrahiere ausschließlich Themen, die für die Jahrgangsstufe "${grade}" relevant sind. Ignoriere Abschnitte, die anderen Klassenstufen zugeordnet sind. Achte auf Formulierungen wie "Klasse 5", "Jahrgangsstufe 5", "5. Klasse", "für die Klassen 5–6" usw. – nur wenn "${grade}" explizit genannt wird oder im angegebenen Bereich liegt, gehört das Thema in die Liste.`;

  const subjectInstruction = subject?.trim()
    ? ` Das Fach ist "${subject}" – konzentriere dich auf fachbezogene Inhalte.`
    : "";

  return basePrompt + gradeInstruction + subjectInstruction;
}
