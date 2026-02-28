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
  Clock,
  BookOpen,
  FileEdit,
  Home,
  Loader2,
  MessageSquare,
  Send,
  Target,
  Users,
} from "lucide-react";
import type { LessonPlanOutput } from "@/lib/ai/schemas";
import type { lessonPlans } from "@/lib/db/schema";
import { SaveSnippetDialog } from "@/components/snippets/save-snippet-dialog";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  // Refresh the displayed plan whenever the AI finishes a response.
  // Watching the status transition to "ready" is more reliable than onFinish
  // because it fires regardless of how the SDK version handles the callback.
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

  const totalMinutes = plan.timeline.reduce(
    (sum, p) => sum + p.durationMinutes,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{plan.topic}</h1>
          <p className="text-muted-foreground">
            {plan.lessonDate
              ? new Date(plan.lessonDate).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Kein Datum"}{" "}
            &middot; {totalMinutes} Minuten
          </p>
        </div>
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
          {/* Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4" />
                Lernziele
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {plan.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    {obj.text}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" />
                Stundenablauf
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {plan.timeline.map((phase, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{phase.phase}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {phase.method}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {phase.durationMinutes} Min.
                      </span>
                      <SaveSnippetDialog
                        phase={phase}
                        lessonPlanId={initialPlan.id}
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Differentiation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Differenzierung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Schwächere Schüler</p>
                <p className="text-sm text-muted-foreground">
                  {plan.differentiation.weaker}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Stärkere Schüler</p>
                <p className="text-sm text-muted-foreground">
                  {plan.differentiation.stronger}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4" />
                Materialien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.materials.map((mat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Badge
                      variant="secondary"
                      className="mt-0.5 shrink-0 text-xs"
                    >
                      {mat.type}
                    </Badge>
                    <div>
                      <span className="font-medium">{mat.title}</span>
                      <p className="text-muted-foreground">{mat.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Homework */}
          {plan.homework && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="size-4" />
                  Hausaufgaben
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{plan.homework}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Chat + Approve */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="size-4" />
                Plan verfeinern
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
