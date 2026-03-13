# Chalkdust — Full App Audit Report

**Date:** 2025-03-13  
**Scope:** Whole app (dashboard, marketing, auth, UI components)  
**Reference:** frontend-design skill, CLAUDE.md, audit skill

---

## Anti-Patterns Verdict

**Verdict: Partial pass — not generic AI slop, but several tells remain.**

The app commits to a clear direction (warm parchment, terracotta accent, Lora + Geist, editorial layout) and avoids the worst AI clichés: no purple-to-blue gradients, no gradient text on headings, no hero-metric big-number cards (dashboard uses an editorial stats row), no identical card grids with icon+heading+text. Landing is asymmetric and left-aligned; dashboard and classes use typography-led hierarchy.

**Specific tells that still read as generic or AI-ish:**

1. **Geist for body** — frontend-design: "DON'T use overused fonts — Inter, Roboto, Arial". Geist is in the same overused-sans bucket; Lora for display is good, but body is still "default Next stack".
2. **Backdrop blur on marketing header** — `bg-background/90 backdrop-blur-sm` (marketing layout) is glassmorphism used decoratively; skill says avoid "glassmorphism everywhere".
3. **Rounded card + shadow** — Card uses `rounded-xl border py-6 shadow-sm`; skill warns against "rounded rectangles with generic drop shadows — safe, forgettable".
4. **Hard-coded palette outside tokens** — Amber/emerald/violet/gray used for status and calendar (e.g. `fill-amber-400`, `bg-amber-50`, `text-emerald-600`, `bg-gray-900`), plus `text-white` on destructive button and global-error using `bg-white`/`text-gray-900`/`dark:bg-gray-950`. Undermines the single-accent, token-based palette in CLAUDE.md.
5. **Card grid on classes page** — Three-column grid of same-structure cards (name, subject, grade, badge); skill: "DON'T use identical card grids".
6. **Modals/dialogs** — Several flows use Dialog/Sheet/AlertDialog; skill: "DON'T use modals unless there's truly no better alternative". Some uses may be justified; worth reviewing each.

**What’s working:** No gradient text, no cyan-on-dark, no bounce easing, no sparkline decoration. Editorial stats, asymmetric landing, and warm oklch palette show intentional design.

---

## Executive Summary

| Severity | Count |
|----------|--------|
| Critical | 2 |
| High     | 6 |
| Medium   | 10 |
| Low      | 8 |

**Total issues:** 26.

**Top critical/high issues:**

1. **Global error page** — Hard-coded gray/white palette, no focus ring on reset button, no design tokens; breaks brand and a11y when errors occur.
2. **Error page (route)** — Reset button has no visible focus indicator (keyboard/screen-reader users).
3. **Heading hierarchy** — Curriculum and plan pages start with `<h2>` with no `<h1>` in the route tree (class layout has no h1).
4. **Touch targets** — Default button/select/input heights (h-8/h-9) below 44px; icon buttons size-8; poor for touch and WCAG 2.5.5.
5. **Fixed-width panel** — Transition page right panel `w-[480px]` can overflow or squeeze on small viewports.
6. **Sidebar rail control** — `tabIndex={-1}` removes rail button from tab order (keyboard can’t focus it).

**Overall quality:** Good foundation (tokens, skip link, semantic main, labeled forms, focus-visible on most controls). The main gaps are: consistent focus on all interactive elements, touch target size, heading semantics on a few routes, and replacing hard-coded colors with tokens (especially error UI and status colors).

**Recommended next steps:** Fix critical a11y (error buttons, heading hierarchy), then normalize error and status UI to design tokens, then improve touch targets and responsive behavior.

---

## Detailed Findings by Severity


#### H3. Transition page: fixed-width right panel  
- **Location:** `src/app/(dashboard)/classes/[id]/transition/page.tsx` — right panel `className="w-[480px] shrink-0 ..."`.  
- **Severity:** High.  
- **Category:** Responsive.  
- **Description:** Right column is fixed at 480px.  
- **Impact:** On viewports &lt; ~768px or when both panels need space, layout can overflow or become unusable.  
- **Recommendation:** Use max-width and/or responsive width (e.g. `w-full max-w-[480px]` or breakpoint-based layout so the wizard stacks or shrinks on small screens).  
- **Suggested command:** `/adapt`.

#### H4. Sidebar rail button removed from tab order  
- **Location:** `src/components/ui/sidebar.tsx` — rail `<button>` has `tabIndex={-1}`.  
- **Severity:** High.  
- **Category:** Accessibility.  
- **Description:** Sidebar collapse/expand rail is not focusable by keyboard.  
- **Impact:** Keyboard-only users cannot collapse/expand the sidebar via that control.  
- **WCAG/Standard:** 2.1.1 Keyboard.  
- **Recommendation:** Remove `tabIndex={-1}` or provide another keyboard-accessible way to toggle sidebar (e.g. header trigger is already present; document that the rail is decorative/optional and ensure header trigger is in tab order and has aria-label).  
- **Suggested command:** `/harden`.

#### H5. Hard-coded status/calendar colors (amber, emerald, violet)  
- **Location:** `snippets-client.tsx` (`fill-amber-400`, `text-amber-400`); `transition-wizard.tsx` (`border-amber-200`, `bg-amber-50`, `text-amber-800`, dark variants); `timeline-section.tsx` (`text-emerald-600`, `text-amber-500`); `series-detail-client.tsx` (`bg-emerald-500`, `bg-amber-500`); `calendar/page.tsx` (`bg-emerald-500`, `bg-amber-500`, `bg-violet-500`).  
- **Severity:** High.  
- **Category:** Theming.  
- **Description:** Status and calendar use Tailwind semantic colors instead of design tokens.  
- **Impact:** Inconsistent with CLAUDE.md “one accent” and token-based palette; harder to theme or adjust for contrast.  
- **Recommendation:** Introduce semantic tokens (e.g. `--success`, `--warning`, `--info`) or map status to existing tokens; use them for status and calendar dots.  
- **Suggested command:** `/normalize`, `/colorize`.

#### H6. Destructive button and badge use `text-white`  
- **Location:** `src/components/ui/button.tsx` (destructive variant), `src/components/ui/badge.tsx` (destructive).  
- **Severity:** High.  
- **Category:** Theming.  
- **Description:** Uses `text-white` instead of a token (e.g. `primary-foreground` or a dedicated destructive-foreground).  
- **Impact:** Pure white can clash with tinted palette; skill says “DON'T use pure white (#fff)”.  
- **Recommendation:** Add `--destructive-foreground` (or use existing foreground token) and use it for text on destructive background.  
- **Suggested command:** `/normalize`.

---

### Medium-Severity Issues

#### M1. Marketing header: backdrop blur (glassmorphism)  
- **Location:** `src/app/(marketing)/layout.tsx` — header `bg-background/90 backdrop-blur-sm`.  
- **Severity:** Medium.  
- **Category:** Anti-pattern (frontend-design).  
- **Description:** Decorative blur without clear functional need.  
- **Impact:** Reads as generic “AI” polish; skill advises against glassmorphism used decoratively.  
- **Recommendation:** Remove blur or tie it to a clear UX need (e.g. legibility over scrolling content); if kept, use sparingly.  
- **Suggested command:** `/distill`, `/quieter`.

#### M2. Card component: rounded-xl + shadow-sm  
- **Location:** `src/components/ui/card.tsx` — `rounded-xl border py-6 shadow-sm`.  
- **Severity:** Medium.  
- **Category:** Anti-pattern.  
- **Description:** Matches the “rounded rectangles with generic drop shadows” pattern.  
- **Impact:** Slightly generic look; CLAUDE prefers “earn every pixel”.  
- **Recommendation:** Consider `rounded-sm` to match rest of app or reduce shadow; keep one consistent card style.  
- **Suggested command:** `/normalize`, `/distill`.

#### M3. Body font: Geist  
- **Location:** `src/app/layout.tsx` — Geist as `--font-geist-sans` for body.  
- **Severity:** Medium.  
- **Category:** Anti-pattern.  
- **Description:** Geist is a common “default” sans; frontend-design discourages overused fonts.  
- **Impact:** Body type doesn’t differentiate the product.  
- **Recommendation:** Consider a more distinctive sans for body while keeping Lora for display; or explicitly accept Geist as a deliberate choice and document it.  
- **Suggested command:** `/bolder`, design decision.

#### M4. Classes page: uniform card grid  
- **Location:** `src/app/(dashboard)/classes/page.tsx` — `lg:grid-cols-3` with identical Card structure (name, subject, grade, badge).  
- **Severity:** Medium.  
- **Category:** Anti-pattern.  
- **Description:** “DON'T use identical card grids — same-sized cards with icon + heading + text, repeated endlessly.” Here it’s name + subject + grade (no icon).  
- **Impact:** Slightly templated feel.  
- **Recommendation:** Differentiate layout or hierarchy for at least one variant (e.g. “current” class), or use list/table for density.  
- **Suggested command:** `/critique`, `/bolder`.

#### M5. Sheet/dialog overlay: `bg-black/50`  
- **Location:** `src/components/ui/sheet.tsx`, `dialog.tsx`, `alert-dialog.tsx` — overlay `bg-black/50`.  
- **Severity:** Medium.  
- **Category:** Theming.  
- **Description:** Pure black overlay instead of token (e.g. `bg-foreground/50` or `--overlay`).  
- **Impact:** Can look harsh on warm background; not token-driven.  
- **Recommendation:** Use a theme token for overlay (e.g. `bg-foreground/50` or dedicated overlay token).  
- **Suggested command:** `/normalize`.

#### M6. Sidebar animates `width` and `left`/`right`  
- **Location:** `src/components/ui/sidebar.tsx` — `transition-[width]`, `transition-[left,right,width]`.  
- **Severity:** Medium.  
- **Category:** Performance.  
- **Description:** Animating layout properties can cause reflows; skill prefers transform/opacity.  
- **Impact:** Possible jank on low-end devices when collapsing/expanding.  
- **Recommendation:** Prefer transform (e.g. translate) for slide and fixed width with overflow hidden where feasible; or accept layout animation if performance is acceptable.  
- **Suggested command:** `/optimize`, `/animate`.

#### M7. Dialog/Sheet close buttons use `outline-hidden`  
- **Location:** `src/components/ui/dialog.tsx`, `sheet.tsx` — close button has `focus:ring-2` but also `focus:outline-hidden`.  
- **Severity:** Medium.  
- **Category:** Accessibility.  
- **Description:** Outline removed; focus depends on ring. If ring is not visible in all themes, focus can be lost.  
- **Impact:** Risk of failing 2.4.7 if ring contrast is low.  
- **Recommendation:** Ensure focus ring has sufficient contrast; keep outline-hidden only if ring is clearly visible.  
- **Suggested command:** `/harden`, `/polish`.

#### M8. New class form: custom input class duplicates Input styles  
- **Location:** `src/app/(dashboard)/classes/new/page.tsx` — schoolYear input uses long custom class string instead of `<Input>`.  
- **Severity:** Medium.  
- **Category:** Consistency / maintainability.  
- **Description:** Inline styles duplicate Input component (border, focus ring, h-9, etc.).  
- **Impact:** Drift if Input changes; possible focus/accessibility differences.  
- **Recommendation:** Use `<Input id="schoolYear" ... />` for consistency.  
- **Suggested command:** `/normalize`, `/extract`.

#### M9. Calendar page: mock data with hard-coded colors in component  
- **Location:** `src/app/(dashboard)/calendar/page.tsx` — `bg-emerald-500`, `bg-amber-500`, `bg-violet-500` in event definitions.  
- **Severity:** Medium.  
- **Category:** Theming.  
- **Description:** Same as H5 but called out for calendar specifically; colors live in page data.  
- **Impact:** Theming and status semantics should be centralized.  
- **Recommendation:** Map event/status to semantic tokens or a small palette derived from theme.  
- **Suggested command:** `/normalize`.

#### M10. Error/global-error: no `lang` on error boundary root (global-error has `lang="de"`)  
- **Location:** `src/app/error.tsx` — fragment root, no `<html lang="de">`.  
- **Severity:** Medium.  
- **Category:** Accessibility.  
- **Description:** Route error is rendered inside app layout; `lang` is set at root layout. So lang is likely still de. If error boundary ever replaced root, lang could be missing.  
- **Impact:** Minor; worth ensuring error UI is always wrapped with correct lang.  
- **Recommendation:** Rely on root layout for lang; document that error.tsx is in-app. For global-error, already correct.  
- **Suggested command:** `/harden`.

---

### Low-Severity Issues

#### L1. Card default padding: `py-6` in base, overridden in many places  
- **Location:** `src/components/ui/card.tsx`; usage in classes, curriculum, etc.  
- **Severity:** Low.  
- **Category:** Consistency.  
- **Description:** Card has built-in `py-6`; CardHeader/CardContent often add their own padding; can lead to double padding or overrides.  
- **Recommendation:** Standardize on Card having no vertical padding and let CardHeader/CardContent define it, or document the default and use overrides sparingly.  
- **Suggested command:** `/polish`.

#### L2. Multiple `Loader2` + `animate-spin` usages  
- **Location:** Many pages (plan, diary, snippets, series, etc.).  
- **Severity:** Low.  
- **Category:** Consistency / extract.  
- **Description:** Loading indicator is repeated in many files.  
- **Impact:** No functional issue; could be a shared `<LoadingSpinner>` for consistency and size/color control.  
- **Recommendation:** Extract a small spinner component and use it everywhere.  
- **Suggested command:** `/extract`.

#### L3. Transition wizard: warning box uses hard-coded amber  
- **Location:** `src/app/(dashboard)/classes/[id]/transition/transition-wizard.tsx` — `border-amber-200 bg-amber-50 ... dark:border-amber-800 ...`.  
- **Severity:** Low.  
- **Category:** Theming (overlap with H5).  
- **Recommendation:** Use semantic warning token or muted + border.  
- **Suggested command:** `/normalize`.

#### L4. Skeleton uses `animate-pulse`  
- **Location:** `src/components/ui/skeleton.tsx`.  
- **Severity:** Low.  
- **Category:** Motion.  
- **Description:** Pulse is opacity-based; acceptable. No bounce.  
- **Impact:** None significant.  
- **Recommendation:** Consider `prefers-reduced-motion: reduce` to disable or reduce pulse.  
- **Suggested command:** `/harden`, `/animate`.

#### L5. Theme toggle present while CLAUDE says “light-only”  
- **Location:** `src/components/theme-toggle.tsx`; layout uses ThemeProvider with defaultTheme="light".  
- **Severity:** Low.  
- **Category:** Theming / product.  
- **Description:** App may support dark in future; current direction is light-only.  
- **Impact:** If dark is not ready, users might see incomplete dark theme.  
- **Recommendation:** If shipping light-only, hide or remove theme toggle until dark is fully supported; otherwise add dark tokens and test.  
- **Suggested command:** Product decision.

#### L6. Sidebar rail: `title="Toggle Sidebar"` in English  
- **Location:** `src/components/ui/sidebar.tsx` — rail button.  
- **Severity:** Low.  
- **Category:** i18n / consistency.  
- **Description:** Rest of app is German; title is English.  
- **Impact:** Minor for German-only users.  
- **Recommendation:** Use German, e.g. "Sidebar ein-/ausblenden", or pass from i18n.  
- **Suggested command:** `/clarify`, `/harden`.

#### L7. tw-animate-css: default easing not verified  
- **Location:** `src/app/globals.css` — `@import "tw-animate-css"`.  
- **Severity:** Low.  
- **Category:** Performance / motion.  
- **Description:** Zoom/slide animations used by Radix; ease curves not verified.  
- **Impact:** If they use bounce/elastic, would conflict with skill.  
- **Recommendation:** Confirm no bounce/elastic in tw-animate; if present, override.  
- **Suggested command:** `/animate`.

#### L8. Missing `nav` landmark on dashboard layout  
- **Location:** `src/app/(dashboard)/layout.tsx` — AppSidebar is the main nav but may render as a `<aside>` or div; sidebar component structure not verified for `<nav>`.  
- **Severity:** Low.  
- **Category:** Accessibility.  
- **Description:** If main app navigation is not wrapped in `<nav>` with an accessible name, landmark could be improved.  
- **Recommendation:** Ensure sidebar is `<nav aria-label="Hauptnavigation">` or equivalent.  
- **Suggested command:** `/polish`, `/harden`.

---

## Patterns & Systemic Issues

1. **Hard-coded colors outside tokens** — Amber, emerald, violet, gray, white appear in ~10+ files (buttons, badges, snippets, calendar, transition wizard, timeline, series detail, global-error). Recommend a pass to introduce semantic tokens (success/warning/info) and use them everywhere.
2. **Touch targets** — Default controls (h-8/h-9, size-8 icon buttons) are below 44px across the app. Address via shared button/input sizing and optional touch-friendly variants.
3. **Focus visibility** — Most interactive elements use `focus-visible:ring-*`; exceptions are error.tsx and global-error.tsx reset buttons and possibly dialog/sheet close if ring contrast is low. One pass to ensure every focusable control has a visible focus state.
4. **Heading hierarchy** — Several class sub-routes (curriculum, plan) start with h2; class layout doesn’t provide an h1. Consider a convention: every route has one h1 (either in layout or page).

---

## Positive Findings

- **Design tokens** — `globals.css` uses oklch and CSS variables for background, foreground, primary, muted, etc.; no raw hex in app code. Single accent (terracotta) is used consistently.
- **Skip link and main** — Dashboard layout has “Zum Hauptinhalt springen” and `<main id="main-content">`; good for keyboard and screen-reader users.
- **Form labels** — Classes new, plan, blank plan, transition wizard, new-series form use `<Label htmlFor="...">` with matching `id` on inputs.
- **Focus-visible on controls** — Button, Input, Select, Badge, sidebar menu items use `focus-visible:ring-*` or equivalent; outline-none is paired with visible ring.
- **Semantic headings** — Most pages have a clear h1 (Dashboard, Meine Klassen, lesson plan topic, etc.); only curriculum and plan under class are missing an h1 in the tree.
- **No gradient text or hero metrics** — Dashboard stats are an editorial row; landing is asymmetric; no “big number + label” hero block.
- **Avatar images** — `AvatarImage` is used with `alt={displayName}` in app-sidebar.
- **Empty states** — Classes and dashboard have instructive empty states with next steps and links.
- **Landing** — Left-aligned hero, asymmetric feature grid, editorial steps with large numbers, no generic three-icon feature row.

---

## Recommendations by Priority

1. **Immediate**
   - Add visible focus style to reset buttons on `error.tsx` and `global-error.tsx`.
   - Switch global-error to design tokens and ensure contrast.

2. **Short-term**
   - Fix heading hierarchy: add h1 for curriculum and plan (or in class layout).
   - Increase touch targets for primary and icon buttons (e.g. min 44px where appropriate).
   - Make transition page right panel responsive (max-width / stacking).
   - Restore sidebar rail to tab order or document and rely on header trigger.

3. **Medium-term**
   - Replace all status/calendar amber/emerald/violet (and destructive `text-white`) with semantic tokens.
   - Remove or justify marketing header backdrop blur; consider card rounded/shadow tweaks.
   - Use `<Input>` on classes/new for schoolYear; consider shared LoadingSpinner.

4. **Long-term**
   - Consider replacing Geist with a more distinctive body font; optional motion audit (tw-animate, reduced-motion).
   - Optional: sidebar width animation with transform instead of width; i18n for sidebar title and any remaining English strings.

---

## Suggested Commands for Fixes

| Focus | Command | Issues addressed |
|-------|--------|-------------------|
| Error UI + focus | `/harden` | C1, C2, L4, M7, M10, L6, L8 |
| Tokens & consistency | `/normalize` | C1, H5, H6, M2, M5, M8, M9, L3 |
| Touch & responsive | `/adapt` | H2, H3 |
| A11y polish | `/polish` | H1, L1, L8 |
| Reduce generic look | `/distill`, `/quieter` | M1, M2 |
| Status/calendar colors | `/colorize` or design tokens | H5, M9 |
| Sidebar & motion | `/optimize`, `/animate` | H4, M6, L7 |
| Copy/i18n | `/clarify` | L6 |
| Component reuse | `/extract` | M8, L2 |
| Design review | `/critique`, `/bolder` | M3, M4 |

Use `/audit` again after changes to confirm issues are resolved and no new ones introduced.
