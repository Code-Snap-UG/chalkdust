"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PencilLine } from "lucide-react";
import { createBlankLessonPlan } from "@/lib/actions/lesson-plans";

type Props = {
  classGroupId: string;
  className: string;
};

export function BlankPlanForm({ classGroupId, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [topic, setTopic] = useState("");
  const [lessonDate, setLessonDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const plan = await createBlankLessonPlan(
          classGroupId,
          topic.trim(),
          lessonDate || undefined,
          parseInt(durationMinutes) || 45
        );
        router.push(`/lesson-plans/${plan.id}`);
      } catch {
        setError("Plan konnte nicht erstellt werden. Bitte erneut versuchen.");
      }
    });
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PencilLine className="size-4" />
          Neuer Unterrichtsplan
        </CardTitle>
        <p className="text-sm text-muted-foreground">{className}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="topic" className="text-xs">
              Thema <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Bruchrechnung – Einführung"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="date" className="text-xs">
                Datum <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="duration" className="text-xs">
                Dauer
              </Label>
              <Select
                value={durationMinutes}
                onValueChange={setDurationMinutes}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="45">45 Min.</SelectItem>
                  <SelectItem value="60">60 Min.</SelectItem>
                  <SelectItem value="90">90 Min.</SelectItem>
                  <SelectItem value="120">120 Min.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!topic.trim() || isPending}
            className="mt-1"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <PencilLine className="mr-2 size-4" />
            )}
            Plan erstellen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
