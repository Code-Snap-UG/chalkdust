import { notFound } from "next/navigation";
import { getLessonPlan } from "@/lib/actions/lesson-plans";
import { LessonPlanDetailClient } from "./lesson-plan-detail-client";

export default async function LessonPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await getLessonPlan(id);

  if (!plan) notFound();

  return <LessonPlanDetailClient initialPlan={plan} />;
}
