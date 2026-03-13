"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold">Etwas ist schiefgelaufen</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
      </p>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          Fehler-ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none rounded-md px-4 py-2 text-sm font-medium"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
