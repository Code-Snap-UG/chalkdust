"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled global error:", error);
  }, [error]);

  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans text-foreground">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <h2 className="text-xl font-semibold">Etwas ist schiefgelaufen</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Ein kritischer Fehler ist aufgetreten. Bitte lade die Seite neu.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Fehler-ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Seite neu laden
          </button>
        </div>
      </body>
    </html>
  );
}
