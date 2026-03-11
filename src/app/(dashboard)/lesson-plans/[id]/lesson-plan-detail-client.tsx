"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Check,
  CheckCircle,
  FileEdit,
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LessonPlanOutput } from "@/lib/ai/schemas";
import type { lessonPlans } from "@/lib/db/schema";
import { TimelineSection } from "./timeline-section";
import { ObjectivesSection } from "./objectives-section";
import { MaterialsSection } from "./materials-section";
import { DifferentiationSection } from "./differentiation-section";
import { HomeworkSection } from "./homework-section";

type PlanRecord = typeof lessonPlans.$inferSelect;

type DisplayPlan = {
  topic: string;
  objectives: LessonPlanOutput["objectives"];
  timeline: LessonPlanOutput["timeline"];
  differentiation: LessonPlanOutput["differentiation"];
  materials: LessonPlanOutput["materials"];
  homework: string | null;
  status: string;
  lessonDate: string | null;
  durationMinutes: number;
};

function toDisplayPlan(record: PlanRecord): DisplayPlan {
  return {
    topic: record.topic,
    objectives: record.objectives as LessonPlanOutput["objectives"],
    timeline: record.timeline as LessonPlanOutput["timeline"],
    differentiation:
      record.differentiation as LessonPlanOutput["differentiation"],
    materials: record.materials as LessonPlanOutput["materials"],
    homework: record.homework,
    status: record.status,
    lessonDate: record.lessonDate,
    durationMinutes: record.durationMinutes,
  };
}

export function LessonPlanDetailClient({
  initialPlan,
}: {
  initialPlan: PlanRecord;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<DisplayPlan>(() =>
    toDisplayPlan(initialPlan)
  );
  const [approving, setApproving] = useState(false);
  const [chatInput, setChatInput] = useState("");

  type MetaEditState =
    | { type: "view" }
    | {
        type: "edit";
        topic: string;
        lessonDate: string;
        durationMinutes: number;
        saving: boolean;
        error: string | null;
      };
  const [metaState, setMetaState] = useState<MetaEditState>({ type: "view" });

  function handleMetaEdit() {
    setMetaState({
      type: "edit",
      topic: plan.topic,
      lessonDate: plan.lessonDate ?? "",
      durationMinutes: plan.durationMinutes,
      saving: false,
      error: null,
    });
  }

  function handleMetaCancel() {
    setMetaState({ type: "view" });
  }

  async function handleMetaSave() {
    if (metaState.type !== "edit") return;
    const trimmedTopic = metaState.topic.trim();
    if (!trimmedTopic) {
      setMetaState({ ...metaState, error: "Titel darf nicht leer sein." });
      return;
    }
    setMetaState({ ...metaState, saving: true, error: null });
    const res = await fetch(`/api/lesson-plans/${initialPlan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: trimmedTopic,
        lessonDate: metaState.lessonDate || null,
        durationMinutes: metaState.durationMinutes,
      }),
    });
    if (!res.ok) {
      setMetaState({ ...metaState, saving: false, error: "Speichern fehlgeschlagen." });
      return;
    }
    const updated: PlanRecord = await res.json();
    setPlan(toDisplayPlan(updated));
    setMetaState({ type: "view" });
  }
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  // Refresh the displayed plan whenever the AI finishes a response.
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev !== "ready" && status === "ready" && messages.length > 0) {
      fetch(`/api/lesson-plans/${initialPlan.id}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: PlanRecord | null) => {
          if (data) setPlan(toDisplayPlan(data));
        });
    }
  }, [status, messages.length, initialPlan.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleBlockSave(
    field: keyof Pick<
      DisplayPlan,
      "objectives" | "timeline" | "differentiation" | "materials" | "homework"
    >,
    value: unknown
  ) {
    const res = await fetch(`/api/lesson-plans/${initialPlan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) {
      throw new Error("Speichern fehlgeschlagen");
    }
    const updated: PlanRecord = await res.json();
    setPlan(toDisplayPlan(updated));
  }

  async function approvePlan() {
    setApproving(true);
    try {
      const res = await fetch(`/api/lesson-plans/${initialPlan.id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
        setPlan((prev) => ({ ...prev, status: "approved" }));
      }
    } catch {
      // silently fail — user stays on page
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        {metaState.type === "edit" ? (
          <div className="flex flex-1 flex-col gap-3">
            <Input
              value={metaState.topic}
              onChange={(e) =>
                setMetaState({ ...metaState, topic: e.target.value, error: null })
              }
              placeholder="Thema der Stunde…"
              className="text-xl font-bold h-auto py-1"
              autoFocus
            />
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={metaState.lessonDate}
                onChange={(e) =>
                  setMetaState({ ...metaState, lessonDate: e.target.value })
                }
                className="w-44 text-sm"
              />
              <Select
                value={String(metaState.durationMinutes)}
                onValueChange={(v) =>
                  setMetaState({ ...metaState, durationMinutes: Number(v) })
                }
              >
                <SelectTrigger className="w-32 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {metaState.error && (
              <p className="text-xs text-destructive">{metaState.error}</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMetaCancel}
                disabled={metaState.saving}
              >
                <X className="mr-1 size-3" />
                Abbrechen
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleMetaSave}
                disabled={metaState.saving}
              >
                {metaState.saving ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Check className="mr-1 size-3" />
                )}
                Speichern
              </Button>
            </div>
          </div>
        ) : (
          <div className="group flex items-start gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{plan.topic}</h1>
              <p className="text-muted-foreground">
                {plan.lessonDate
                  ? new Date(plan.lessonDate).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Kein Datum"}
                {" · "}
                {plan.durationMinutes} min
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100 hover:text-foreground"
              onClick={handleMetaEdit}
              title="Titel und Datum bearbeiten"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        )}
        <Badge variant={plan.status === "approved" ? "default" : "secondary"}>
          {plan.status === "approved" ? (
            <>
              <CheckCircle className="mr-1 size-3" />
              Freigegeben
            </>
          ) : (
            <>
              <FileEdit className="mr-1 size-3" />
              Entwurf
            </>
          )}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Plan content */}
        <div className="flex flex-col gap-6">
          <ObjectivesSection
            objectives={plan.objectives}
            onSave={(updated) => handleBlockSave("objectives", updated)}
          />

          <TimelineSection
            phases={plan.timeline}
            lessonDurationMinutes={plan.durationMinutes}
            lessonPlanId={initialPlan.id}
            onSave={(updated) => handleBlockSave("timeline", updated)}
          />

          <DifferentiationSection
            differentiation={plan.differentiation}
            onSave={(updated) => handleBlockSave("differentiation", updated)}
          />

          <MaterialsSection
            materials={plan.materials}
            onSave={(updated) => handleBlockSave("materials", updated)}
          />

          <HomeworkSection
            homework={plan.homework}
            onSave={(updated) => handleBlockSave("homework", updated)}
          />
        </div>

        {/* Right: Chat + Approve */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="size-4" />
                ChAi - Plan verfeinern
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 && (
                <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
                  {messages.map((m) => {
                    const hasText = m.parts.some(
                      (p) => p.type === "text" && p.text.trim()
                    );
                    if (!hasText && m.role === "assistant") return null;
                    return (
                      <div
                        key={m.id}
                        className={`text-sm ${m.role === "user" ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        <span className="font-medium">
                          {m.role === "user" ? "Du: " : "KI: "}
                        </span>
                        {m.parts.map((part, i) =>
                          part.type === "text" ? (
                            <span key={i}>{part.text}</span>
                          ) : null
                        )}
                      </div>
                    );
                  })}
                  {(status === "streaming" || status === "submitted") && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      KI antwortet...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
              {error && (
                <p className="mb-3 text-sm text-destructive">
                  Fehler: {error.message}
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim() && status === "ready") {
                    sendMessage(
                      { text: chatInput },
                      { body: { lessonPlanId: initialPlan.id } }
                    );
                    setChatInput("");
                  }
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="z.B. Mach die Gruppenarbeit kürzer..."
                  className="flex-1"
                  disabled={status !== "ready"}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={status !== "ready" || !chatInput.trim()}
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {plan.status === "draft" && (
            <Button
              onClick={approvePlan}
              disabled={approving}
              className="w-full"
              size="lg"
            >
              {approving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Plan freigeben & speichern
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
