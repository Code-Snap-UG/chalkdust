/**
 * Shared Clerk appearance config — aligns with design system tokens.
 * Uses CSS variables so theme changes propagate.
 */
export const clerkAppearance = {
  options: {
    unsafe_disableDevelopmentModeWarnings: false,
  },
  variables: {
    colorBackground: "transparent",
    colorPrimary: "var(--primary)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInput: "transparent",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyButtons: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "0.875rem",
    spacingUnit: "1rem",
  },
  elements: {
    otpCodeFieldInput: {
      color: "oklch(0.14 0.022 55)",
      caretColor: "oklch(0.14 0.022 55)",
    },
  },
};
