import { getCurriculum, getCurriculumTopics } from "@/lib/actions/curriculum";
import { CurriculumClient } from "./curriculum-client";

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [curriculum, topics] = await Promise.all([
    getCurriculum(id),
    getCurriculumTopics(id),
  ]);

  return (
    <CurriculumClient
      classGroupId={id}
      curriculum={
        curriculum
          ? { id: curriculum.id, sourceFileName: curriculum.sourceFileName ?? null }
          : null
      }
      topics={topics}
    />
  );
}
