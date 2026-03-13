import { NextResponse } from "next/server";
import { addMilestone } from "@/lib/actions/series";
import { withLogging } from "@/lib/logger";

export const POST = withLogging(
  "api.series.milestones.add",
  async (request, { params }) => {
    const { id } = await params;
    const body = await request.json();

    const { title, description, learningGoals, estimatedLessons, insertAfterOrder } = body;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const milestone = await addMilestone(
      id,
      {
        title,
        description,
        learningGoals: learningGoals || [],
        estimatedLessons: estimatedLessons || 1,
      },
      insertAfterOrder
    );

    return NextResponse.json(milestone, { status: 201 });
  }
);
