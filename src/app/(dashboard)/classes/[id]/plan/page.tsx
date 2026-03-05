"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  BookOpen,
  Users,
  Home,
} from "lucide-react";

type TimelinePhase = {
  phase: string;
  durationMinutes: number;
  description: string;
  method: string;
};

type Objective = {
  text: string;
  curriculumTopicId?: string;
};

type MaterialItem = {
  title: string;
  type: string;
  description: string;
};

type Differentiation = {
  weaker: string;
  stronger: string;
};

type LessonPlan = {
  topic: string;
  objectives: Objective[];
  timeline: TimelinePhase[];
  differentiation: Differentiation;
  materials: MaterialItem[];
  homework?: string;
};

type CurriculumTopic = {
  id: string;
  title: string;
  description: string | null;
  competencyArea: string | null;
};

export default function PlanLessonPage() {
  const params = useParams();
  const router = useRouter();
  const classGroupId = params.id as string;

  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  // Form state
  const [lessonDate, setLessonDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [topicId, setTopicId] = useState("");
  const [topicFreeText, setTopicFreeText] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  const { data: classData } = useSWR<{ status?: string }>(
    `/api/classes/${classGroupId}`,
    fetcher
  );
  const { data: topicsData } = useSWR<{ topics?: CurriculumTopic[] }>(
    `/api/classes/${classGroupId}/topics`,
    fetcher
  );

  const curriculumTopics = topicsData?.topics ?? [];

  // Redirect if the class is archived
  useEffect(() => {
    if (classData?.status === "archived") {
      router.replace(`/classes/${classGroupId}`);
    }
  }, [classData, classGroupId, router]);

  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: () => {
      if (planId) refreshPlan(planId);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function refreshPlan(id: string) {
    const res = await fetch(`/api/lesson-plans/${id}`);
    if (res.ok) {
      const data = await res.json();
      setPlan({
        topic: data.topic,
        objectives: data.objectives,
        timeline: data.timeline,
        differentiation: data.differentiation,
        materials: data.materials,
        homework: data.homework,
      });
    }
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const res = await fetch("/api/lesson-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGroupId,
          lessonDate: lessonDate || undefined,
          durationMinutes: parseInt(durationMinutes) || 45,
          topicId: topicId || undefined,
          topicFreeText: topicFreeText || undefined,
          learningGoals: learningGoals || undefined,
          additionalNotes: additionalNotes || undefined,
        }),
      });

      if (!res.ok) {
        alert("Fehler bei der Planerstellung.");
        return;
      }

      const data = await res.json();
      setPlan(data.plan);
      setPlanId(data.id);
    } catch {
      alert("Fehler bei der Planerstellung.");
    } finally {
      setGenerating(false);
    }
  }

  async function approvePlan() {
    if (!planId) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/lesson-plans/${planId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/lesson-plans/${planId}`);
      }
    } catch {
      alert("Fehler beim Speichern.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Stunde planen</h2>
        <p className="text-muted-foreground">
          Gib Kontext ein und lass die KI einen Unterrichtsplan erstellen.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stundendetails</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="date" className="text-xs">
                    Datum
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
                    Dauer (Min.)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min={15}
                    max={180}
                  />
                </div>
              </div>

              {curriculumTopics.length > 0 && (
                <div className="grid gap-1.5">
                  <Label htmlFor="topic" className="text-xs">
                    Thema aus dem Curriculum
                  </Label>
                  <select
                    id="topic"
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">-- Thema wählen --</option>
                    {curriculumTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="topicFree" className="text-xs">
                  Oder freies Thema
                </Label>
                <Input
                  id="topicFree"
                  value={topicFreeText}
                  onChange={(e) => setTopicFreeText(e.target.value)}
                  placeholder="z.B. Bruchrechnung – Einführung"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="goals" className="text-xs">
                  Lernziele (optional)
                </Label>
                <Input
                  id="goals"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="Was sollen die Schüler am Ende können?"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="notes" className="text-xs">
                  Zusätzliche Hinweise (optional)
                </Label>
                <Input
                  id="notes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="z.B. Computerraum verfügbar, 3 SuS fehlen"
                />
              </div>

              <Button
                onClick={generatePlan}
                disabled={generating || (!topicId && !topicFreeText)}
                className="mt-2"
              >
                {generating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                Unterrichtsplan erstellen
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Generated plan + chat */}
        <div className="flex flex-col gap-4">
          {!plan && !generating && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
              <Sparkles className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Fülle das Formular aus und klicke auf &ldquo;Unterrichtsplan
                erstellen&rdquo;, um loszulegen.
              </p>
            </div>
          )}

          {generating && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border bg-muted/20 p-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                KI erstellt deinen Unterrichtsplan...
              </p>
            </div>
          )}

          {plan && !generating && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{plan.topic}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {/* Objectives */}
                  <div>
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                      <Target className="size-3.5" />
                      Lernziele
                    </h4>
                    <ul className="space-y-1">
                      {plan.objectives.map((obj, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          &bull; {obj.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                      <Clock className="size-3.5" />
                      Stundenablauf
                    </h4>
                    <div className="space-y-2">
                      {plan.timeline.map((phase, i) => (
                        <div key={i} className="rounded-md border p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {phase.phase}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {phase.method}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {phase.durationMinutes} Min.
                              </span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {phase.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Differentiation */}
                  <div>
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                      <Users className="size-3.5" />
                      Differenzierung
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <strong>Schwächere:</strong>{" "}
                        {plan.differentiation.weaker}
                      </p>
                      <p>
                        <strong>Stärkere:</strong>{" "}
                        {plan.differentiation.stronger}
                      </p>
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                      <BookOpen className="size-3.5" />
                      Materialien
                    </h4>
                    <ul className="space-y-1">
                      {plan.materials.map((mat, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          &bull; <strong>{mat.title}</strong> ({mat.type}):{" "}
                          {mat.description}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Homework */}
                  {plan.homework && (
                    <div>
                      <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                        <Home className="size-3.5" />
                        Hausaufgaben
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {plan.homework}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chat refinement */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="size-4" />
                    Plan verfeinern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {messages.length > 0 && (
                    <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
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
                        sendMessage({ text: chatInput }, { body: { lessonPlanId: planId } });
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

              {/* Approve */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
