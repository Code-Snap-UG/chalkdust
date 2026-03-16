import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-[17px] font-bold italic leading-none text-primary tracking-tight transition-opacity group-hover:opacity-80">
              cd
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight transition-opacity group-hover:opacity-80">
              Chalkdust
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-7 sm:flex">
            <Link
              href="#die-idee"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Die Idee
            </Link>
            <Link
              href="#funktionen"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Funktionen
            </Link>
            <Link
              href="#preise"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Preise
            </Link>
          </nav>

          {/* Auth actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-sm" asChild>
              <Link href="/dashboard">Anmelden</Link>
            </Button>
            <Button size="sm" className="text-sm" asChild>
              <Link href="/dashboard">Kostenlos starten</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-sm font-bold italic leading-none text-primary tracking-tight">
                cd
              </span>
              <span className="font-display text-sm font-semibold tracking-tight">
                Chalkdust
              </span>
            </Link>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Impressum
              </Link>
              <span>© 2026 Chalkdust. Für Lehrkräfte, von Lehrkräften.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
