import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClassGroup } from "@/lib/actions/class-groups";
import { BlankPlanForm } from "./blank-plan-form";

export default async function BlankPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classGroup = await getClassGroup(id);

  if (!classGroup) notFound();
  if (classGroup.status === "archived") redirect(`/classes/${id}`);

  const className = `${classGroup.name} – ${classGroup.subject} · Klasse ${classGroup.grade}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/classes/${id}/plan`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Stunde planen
        </Link>
        <h2 className="text-xl font-bold tracking-tight">Manuell erstellen</h2>
        <p className="text-sm text-muted-foreground">
          Erstelle einen leeren Unterrichtsplan und fülle ihn selbst aus.
        </p>
      </div>

      <BlankPlanForm classGroupId={id} className={className} />
    </div>
  );
}
