# TODO / Technical Debt

A running list of known improvements, cleanups, and tech debt to address.

---

## Database

- [x] **Remove `curricula.parsed_content`** — the raw PDF text stored at upload time is never read back after the initial AI extraction. It serves no runtime purpose and wastes storage. Options: drop the column entirely, or move to cheap object storage (S3/R2) if re-extraction replay is ever needed. The extracted `curriculum_topics` rows are the only data that matters.

---

## AI

- [ ] **Reconsider max tool call steps per message (currently 5)** — evaluate whether 5 is the right limit for plan refinement. Too low and complex requests get cut off; too high and runaway chains become a risk. Tune based on real usage patterns.
- [x] **Add XML structure to `assembleContext()`** — replace the current `---` separated flat text blocks with named XML tags (`<lehrplan>`, `<unterrichtsreihe>`, `<klassenbuch>`, `<vorgaenger_klasse>`, `<lehrerangaben>`). Anthropic research shows this reduces misinterpretation on multi-document inputs and can improve structured generation quality. Low-risk, high-value change.

---
