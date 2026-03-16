const VAGUE_PATTERNS = [
  /^wie geplant$/i,
  /^alles wie geplant/i,
  /^alles erledigt$/i,
  /^s\.?\s*o\.?$/i,
  /^siehe plan/i,
  /^nichts besonderes$/i,
  /^wie besprochen$/i,
  /^erledigt$/i,
  /^ok$/i,
  /^passt$/i,
  /^gut gelaufen$/i,
  /^lief gut$/i,
  /^wie vorbereitet$/i,
  /^durchgeführt$/i,
  /^gemacht$/i,
];

/**
 * Detect whether an actualSummary is too vague to be useful as AI context.
 * Returns true for null/empty values, very short strings (< 30 chars), or
 * strings matching known low-information patterns.
 */
export function isVagueSummary(text: string | null): boolean {
  if (!text || !text.trim()) return true;
  const trimmed = text.trim();
  if (trimmed.length < 30) return true;
  return VAGUE_PATTERNS.some((pattern) => pattern.test(trimmed));
}
