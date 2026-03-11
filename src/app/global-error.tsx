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
      <body className="flex min-h-screen items-center justify-center bg-white font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <h2 className="text-xl font-semibold">Etwas ist schiefgelaufen</h2>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            Ein kritischer Fehler ist aufgetreten. Bitte lade die Seite neu.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
              Fehler-ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Seite neu laden
          </button>
        </div>
      </body>
    </html>
  );
}
