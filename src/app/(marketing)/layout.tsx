import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <span className="text-lg font-bold">Chalkdust</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="#funktionen"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Funktionen
            </Link>
            <Link
              href="#so-funktionierts"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              So funktioniert&apos;s
            </Link>
            <Link
              href="#preise"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Preise
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Anmelden</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard">Kostenlos starten</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <GraduationCap className="size-3" />
              </div>
              <span className="text-sm font-semibold">Chalkdust</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 Chalkdust. Für Lehrkräfte, von Lehrkräften.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
