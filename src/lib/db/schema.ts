import {
  pgTable,
  text,
  varchar,
  integer,
  date,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const teachers = pgTable("teachers", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classGroups = pgTable("class_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .references(() => teachers.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  grade: varchar("grade", { length: 20 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  schoolYear: varchar("school_year", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  predecessorId: uuid("predecessor_id").references((): AnyPgColumn => classGroups.id),
  transitionSummary: text("transition_summary"),
  transitionStrengths: text("transition_strengths"),
  transitionWeaknesses: text("transition_weaknesses"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const curricula = pgTable("curricula", {
  id: uuid("id").defaultRandom().primaryKey(),
  classGroupId: uuid("class_group_id")
    .references(() => classGroups.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  state: varchar("state", { length: 100 }),
  subject: varchar("subject", { length: 100 }).notNull(),
  grade: varchar("grade", { length: 20 }).notNull(),
  sourceFileName: varchar("source_file_name", { length: 255 }),
  parsedContent: text("parsed_content"),
  topicIndex: jsonb("topic_index"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const curriculumTopics = pgTable("curriculum_topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  curriculumId: uuid("curriculum_id")
    .references(() => curricula.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  competencyArea: varchar("competency_area", { length: 255 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Lesson Series (Unterrichtsreihe / Reihenplanung)

export const lessonSeries = pgTable("lesson_series", {
  id: uuid("id").defaultRandom().primaryKey(),
  classGroupId: uuid("class_group_id")
    .references(() => classGroups.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  estimatedLessons: integer("estimated_lessons").notNull(),
  estimatedWeeks: integer("estimated_weeks"),
  startDate: date("start_date"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seriesMilestones = pgTable("series_milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  seriesId: uuid("series_id")
    .references(() => lessonSeries.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  learningGoals: jsonb("learning_goals").notNull().default([]),
  estimatedLessons: integer("estimated_lessons").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seriesCurriculumTopics = pgTable(
  "series_curriculum_topics",
  {
    seriesId: uuid("series_id")
      .references(() => lessonSeries.id, { onDelete: "cascade" })
      .notNull(),
    curriculumTopicId: uuid("curriculum_topic_id")
      .references(() => curriculumTopics.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.seriesId, t.curriculumTopicId] })]
);

export const lessonPlans = pgTable("lesson_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  classGroupId: uuid("class_group_id")
    .references(() => classGroups.id, { onDelete: "cascade" })
    .notNull(),
  seriesId: uuid("series_id").references(() => lessonSeries.id, {
    onDelete: "set null",
  }),
  milestoneId: uuid("milestone_id").references(() => seriesMilestones.id, {
    onDelete: "set null",
  }),
  lessonDate: date("lesson_date"),
  durationMinutes: integer("duration_minutes").notNull().default(45),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  topic: text("topic").notNull(),
  objectives: jsonb("objectives").notNull().default([]),
  timeline: jsonb("timeline").notNull().default([]),
  differentiation: jsonb("differentiation").notNull().default({}),
  materials: jsonb("materials").notNull().default([]),
  homework: text("homework"),
  llmConversationId: varchar("llm_conversation_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diaryEntries = pgTable("diary_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  classGroupId: uuid("class_group_id")
    .references(() => classGroups.id, { onDelete: "cascade" })
    .notNull(),
  lessonPlanId: uuid("lesson_plan_id").references(() => lessonPlans.id),
  entryDate: date("entry_date").notNull(),
  plannedSummary: text("planned_summary"),
  actualSummary: text("actual_summary"),
  teacherNotes: text("teacher_notes"),
  progressStatus: varchar("progress_status", { length: 30 })
    .notNull()
    .default("planned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id, {
    onDelete: "cascade",
  }),
  lessonPlanId: uuid("lesson_plan_id").references(() => lessonPlans.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  source: varchar("source", { length: 20 }).notNull().default("generated"),
  content: text("content"),
  fileUrl: varchar("file_url", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations

export const teachersRelations = relations(teachers, ({ many }) => ({
  classGroups: many(classGroups),
}));

export const classGroupsRelations = relations(classGroups, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [classGroups.teacherId],
    references: [teachers.id],
  }),
  predecessor: one(classGroups, {
    fields: [classGroups.predecessorId],
    references: [classGroups.id],
    relationName: "predecessorLink",
  }),
  curriculum: one(curricula),
  lessonPlans: many(lessonPlans),
  diaryEntries: many(diaryEntries),
  lessonSeries: many(lessonSeries),
}));

export const curriculaRelations = relations(curricula, ({ one, many }) => ({
  classGroup: one(classGroups, {
    fields: [curricula.classGroupId],
    references: [classGroups.id],
  }),
  topics: many(curriculumTopics),
}));

export const curriculumTopicsRelations = relations(
  curriculumTopics,
  ({ one }) => ({
    curriculum: one(curricula, {
      fields: [curriculumTopics.curriculumId],
      references: [curricula.id],
    }),
  })
);

export const lessonSeriesRelations = relations(
  lessonSeries,
  ({ one, many }) => ({
    classGroup: one(classGroups, {
      fields: [lessonSeries.classGroupId],
      references: [classGroups.id],
    }),
    milestones: many(seriesMilestones),
    lessonPlans: many(lessonPlans),
    curriculumTopicLinks: many(seriesCurriculumTopics),
  })
);

export const seriesMilestonesRelations = relations(
  seriesMilestones,
  ({ one, many }) => ({
    series: one(lessonSeries, {
      fields: [seriesMilestones.seriesId],
      references: [lessonSeries.id],
    }),
    lessonPlans: many(lessonPlans),
  })
);

export const seriesCurriculumTopicsRelations = relations(
  seriesCurriculumTopics,
  ({ one }) => ({
    series: one(lessonSeries, {
      fields: [seriesCurriculumTopics.seriesId],
      references: [lessonSeries.id],
    }),
    curriculumTopic: one(curriculumTopics, {
      fields: [seriesCurriculumTopics.curriculumTopicId],
      references: [curriculumTopics.id],
    }),
  })
);

export const lessonPlansRelations = relations(
  lessonPlans,
  ({ one, many }) => ({
    classGroup: one(classGroups, {
      fields: [lessonPlans.classGroupId],
      references: [classGroups.id],
    }),
    series: one(lessonSeries, {
      fields: [lessonPlans.seriesId],
      references: [lessonSeries.id],
    }),
    milestone: one(seriesMilestones, {
      fields: [lessonPlans.milestoneId],
      references: [seriesMilestones.id],
    }),
    diaryEntries: many(diaryEntries),
    materials: many(materials),
  })
);

export const diaryEntriesRelations = relations(
  diaryEntries,
  ({ one, many }) => ({
    classGroup: one(classGroups, {
      fields: [diaryEntries.classGroupId],
      references: [classGroups.id],
    }),
    lessonPlan: one(lessonPlans, {
      fields: [diaryEntries.lessonPlanId],
      references: [lessonPlans.id],
    }),
    materials: many(materials),
  })
);

export const materialsRelations = relations(materials, ({ one }) => ({
  diaryEntry: one(diaryEntries, {
    fields: [materials.diaryEntryId],
    references: [diaryEntries.id],
  }),
  lessonPlan: one(lessonPlans, {
    fields: [materials.lessonPlanId],
    references: [lessonPlans.id],
  }),
}));

// Lesson Snippets

export const lessonSnippets = pgTable("lesson_snippets", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .references(() => teachers.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  phase: varchar("phase", { length: 100 }).notNull(),
  durationMinutes: integer("duration_minutes"),
  description: text("description").notNull(),
  method: varchar("method", { length: 255 }),
  tags: jsonb("tags").notNull().default([]),
  notes: text("notes"),
  sourceLessonPlanId: uuid("source_lesson_plan_id").references(
    () => lessonPlans.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const snippetClassFavorites = pgTable(
  "snippet_class_favorites",
  {
    snippetId: uuid("snippet_id")
      .references(() => lessonSnippets.id, { onDelete: "cascade" })
      .notNull(),
    classGroupId: uuid("class_group_id")
      .references(() => classGroups.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.snippetId, t.classGroupId] })]
);

// Application Logs

export const appLogs = pgTable("app_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  level: varchar("level", { length: 20 }).notNull(),
  operation: varchar("operation", { length: 255 }).notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  expected: text("expected"),
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  metadata: jsonb("metadata"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const lessonSnippetsRelations = relations(
  lessonSnippets,
  ({ one, many }) => ({
    teacher: one(teachers, {
      fields: [lessonSnippets.teacherId],
      references: [teachers.id],
    }),
    sourceLessonPlan: one(lessonPlans, {
      fields: [lessonSnippets.sourceLessonPlanId],
      references: [lessonPlans.id],
    }),
    classFavorites: many(snippetClassFavorites),
  })
);

export const snippetClassFavoritesRelations = relations(
  snippetClassFavorites,
  ({ one }) => ({
    snippet: one(lessonSnippets, {
      fields: [snippetClassFavorites.snippetId],
      references: [lessonSnippets.id],
    }),
    classGroup: one(classGroups, {
      fields: [snippetClassFavorites.classGroupId],
      references: [classGroups.id],
    }),
  })
);
