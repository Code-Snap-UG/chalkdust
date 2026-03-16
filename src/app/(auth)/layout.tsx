export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const rulePositions = [
    "8%", "14%", "20%", "26%", "32%", "38%", "44%", "50%",
    "56%", "62%", "68%", "74%", "80%", "86%", "92%",
  ];

  return (
    <div className="auth-root">
      {/* ── Brand panel (desktop only, decorative) ── */}
      <aside className="auth-brand paper-grain" aria-hidden="true">
        {/* Margin line: terracotta, draws from top → bottom */}
        <div className="auth-margin-line" />

        {/* Ruled lines: dark ink, each draws left → right with staggered delay */}
        {rulePositions.map((top, i) => (
          <div
            key={top}
            className="auth-rule"
            style={{ top, animationDelay: `${0.12 + i * 0.045}s` }}
          />
        ))}

        {/* Content layer */}
        <div className="auth-brand-content">
          <p className="auth-brand-label">Chalkdust</p>

          <h2 className="auth-brand-tagline">
            Unterrichten<br />
            mit <span>Klarheit.</span>
          </h2>

          <blockquote className="auth-brand-quote">
            <p>
              „Endlich ein Werkzeug, das sich meinem
              Unterricht anpasst — nicht umgekehrt."
            </p>
            <cite>Sarah K., Gymnasiallehrerin</cite>
          </blockquote>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-form-area">
        {/* Wordmark shown only on mobile */}
        <p className="auth-mobile-wordmark">Chalkdust</p>

        <div className="auth-form-inner">{children}</div>
      </main>
    </div>
  );
}
