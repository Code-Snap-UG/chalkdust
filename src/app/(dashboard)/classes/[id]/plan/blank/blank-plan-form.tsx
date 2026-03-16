"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const [durationMinutes, setDurationMinutes] = useState("90");
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
          parseInt(durationMinutes) || 90
        );
        router.push(`/lesson-plans/${plan.id}`);
      } catch {
        setError("Plan konnte nicht erstellt werden. Bitte erneut versuchen.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="topic"
          className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
        >
          Thema <span className="text-destructive">*</span>
        </Label>
        <Input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="z.B. Bruchrechnung – Einführung"
          required
          autoFocus
          className="h-11 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="date"
            className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
          >
            Datum{" "}
            <span className="font-normal normal-case tracking-normal opacity-60">
              optional
            </span>
          </Label>
          <Input
            id="date"
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="duration"
            className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground"
          >
            Dauer
          </Label>
          <Select value={durationMinutes} onValueChange={setDurationMinutes}>
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!topic.trim() || isPending} size="lg" className="mt-1 w-full">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PencilLine className="size-4" />
        )}
        Plan erstellen
      </Button>
    </form>
  );
}
