import { getSnippets } from "@/lib/actions/snippets";
import { SnippetsClient } from "./snippets-client";

const HARDCODED_TEACHER_ID = "00000000-0000-0000-0000-000000000001";

export default async function SnippetsPage() {
  const snippets = await getSnippets(HARDCODED_TEACHER_ID);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bausteine</h1>
        <p className="text-muted-foreground">
          Deine gespeicherten Unterrichtsbausteine – wiederverwendbar für jede
          Klasse.
        </p>
      </div>
      <SnippetsClient snippets={snippets} />
    </div>
  );
}
