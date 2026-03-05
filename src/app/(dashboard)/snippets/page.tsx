import { getSnippets, getClassFavorites } from "@/lib/actions/snippets";
import { getClassGroups } from "@/lib/actions/class-groups";
import { SnippetsClient } from "./snippets-client";

const HARDCODED_TEACHER_ID = "00000000-0000-0000-0000-000000000001";

export default async function SnippetsPage({
  searchParams,
}: {
  searchParams: Promise<{ classGroupId?: string }>;
}) {
  const { classGroupId } = await searchParams;

  const [snippets, activeClasses, classFavorites] = await Promise.all([
    getSnippets(HARDCODED_TEACHER_ID),
    getClassGroups("active"),
    classGroupId ? getClassFavorites(classGroupId) : Promise.resolve([]),
  ]);

  const favoritedIds = classFavorites.map((s) => s.id);
  const activeClass = classGroupId
    ? activeClasses.find((c) => c.id === classGroupId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bausteine</h1>
        <p className="text-muted-foreground">
          {activeClass
            ? `Bausteine für ${activeClass.name} – ${activeClass.subject}`
            : "Deine gespeicherten Unterrichtsbausteine – wiederverwendbar für jede Klasse."}
        </p>
      </div>
      <SnippetsClient
        snippets={snippets}
        classGroupId={classGroupId}
        favoritedIds={favoritedIds}
        activeClasses={activeClasses}
      />
    </div>
  );
}
