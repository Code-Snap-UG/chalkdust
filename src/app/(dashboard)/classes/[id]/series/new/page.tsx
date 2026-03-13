import { getClassGroup } from "@/lib/actions/class-groups";
import { getCurriculumTopics } from "@/lib/actions/curriculum";
import { notFound, redirect } from "next/navigation";
import { NewSeriesForm } from "./new-series-form";

export default async function NewSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classGroup, topics] = await Promise.all([
    getClassGroup(id),
    getCurriculumTopics(id),
  ]);

  if (!classGroup) notFound();
  if (classGroup.status === "archived") redirect(`/classes/${id}`);

  return (
    <NewSeriesForm
      classGroupId={id}
      className={classGroup.name}
      subject={classGroup.subject}
      grade={classGroup.grade}
      curriculumTopics={topics}
    />
  );
}
