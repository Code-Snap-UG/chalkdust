import { NextResponse } from "next/server";
import {
  getSeriesWithDetails,
  updateSeries,
  deleteSeries,
} from "@/lib/actions/series";
import { withLogging } from "@/lib/logger";

export const GET = withLogging(
  "api.series.get",
  async (_request, { params }) => {
    const { id } = await params;
    const series = await getSeriesWithDetails(id);
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(series);
  }
);

export const PATCH = withLogging(
  "api.series.patch",
  async (request, { params }) => {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateSeries(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }
);

export const DELETE = withLogging(
  "api.series.delete",
  async (_request, { params }) => {
    const { id } = await params;
    await deleteSeries(id);
    return NextResponse.json({ ok: true });
  }
);
