import { getClassGroup } from "@/lib/actions/class-groups";
import { getSeriesWithDetails } from "@/lib/actions/series";
import { notFound } from "next/navigation";
import { SeriesDetailClient } from "./series-detail-client";

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string; seriesId: string }>;
}) {
  const { id, seriesId } = await params;
  const [classGroup, series] = await Promise.all([
    getClassGroup(id),
    getSeriesWithDetails(seriesId),
  ]);

  if (!classGroup || !series) notFound();

  return (
    <SeriesDetailClient
      classGroupId={id}
      classGroup={classGroup}
      series={series}
    />
  );
}
