import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Archive, ArrowLeft } from "lucide-react";
import { getClassGroup } from "@/lib/actions/class-groups";
import { getDiaryEntries } from "@/lib/actions/diary";
import { TransitionDiaryPanel } from "./transition-diary-panel";
import { TransitionWizard } from "./transition-wizard";

export default async function TransitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [classGroup, diaryEntries] = await Promise.all([
    getClassGroup(id),
    getDiaryEntries(id),
  ]);

  if (!classGroup) notFound();
  if (classGroup.status === "archived") redirect(`/classes/${id}`);

  const label = `${classGroup.name} – ${classGroup.subject}`;

  return (
    <div className="-m-4 md:-m-6 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Page header: back link + title + class metadata */}
      <div className="shrink-0 border-b px-6 py-4">
        <Link
          href={`/classes/${id}`}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="size-3.5" />
          Zurück zur Klasse
        </Link>
        <div className="flex items-center gap-2">
          <Archive className="size-5 text-muted-foreground" />
          <h1 className="text-base font-semibold">Schuljahr abschließen</h1>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {classGroup.name} &middot; Klasse {classGroup.grade} &middot; {classGroup.subject} &middot; {classGroup.schoolYear}
        </p>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: diary reference */}
        <div className="flex-1 overflow-y-auto border-r p-6">
          <TransitionDiaryPanel
            entries={diaryEntries}
            label={label}
          />
        </div>

        {/* Right panel: wizard */}
        <div className="w-[480px] shrink-0 overflow-y-auto p-6">
          <TransitionWizard
            classGroupId={id}
            name={classGroup.name}
            grade={classGroup.grade}
            subject={classGroup.subject}
            schoolYear={classGroup.schoolYear}
          />
        </div>
      </div>
    </div>
  );
}
