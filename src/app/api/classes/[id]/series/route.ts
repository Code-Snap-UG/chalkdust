import { NextResponse } from "next/server";
import { getSeriesForClass, createSeries } from "@/lib/actions/series";
import { withLogging } from "@/lib/logger";

export const GET = withLogging(
  "api.classes.series.list",
  async (_request, { params }) => {
    const { id } = await params;
    const series = await getSeriesForClass(id);
    return NextResponse.json({ series });
  }
);

export const POST = withLogging(
  "api.classes.series.create",
  async (request, { params }) => {
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      estimatedLessons,
      estimatedWeeks,
      startDate,
      milestones,
      curriculumTopicIds,
    } = body;

    if (!title || !estimatedLessons) {
      return NextResponse.json(
        { error: "title and estimatedLessons are required" },
        { status: 400 }
      );
    }

    const series = await createSeries(id, {
      title,
      description,
      estimatedLessons,
      estimatedWeeks,
      startDate,
      milestones,
      curriculumTopicIds,
    });

    return NextResponse.json(series, { status: 201 });
  }
);
