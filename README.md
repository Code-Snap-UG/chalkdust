# Chalkdust -- KI-gestutzte Unterrichtsplanung

AI-assisted lesson planning for German teachers. Built with Next.js 16, Tailwind CSS, shadcn/ui, Drizzle ORM, PostgreSQL, and the Vercel AI SDK.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** 20 or later -- [Download](https://nodejs.org/)
- **PostgreSQL** 15 or later -- see database setup below
- An API key for **OpenAI** and/or **Anthropic** (at least one is required)

### Installing PostgreSQL

Pick whichever method suits your setup:

**macOS (Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**macOS (Postgres.app):**

Download from [postgresapp.com](https://postgresapp.com/) and start the app. It runs on port 5432 by default.

**Docker:**

```bash
docker run --name chalkdust-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=chalkdust \
  -p 5432:5432 \
  -d postgres:16
```

**Linux (apt):**

```bash
sudo apt update && sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step-by-step setup

### 1. Clone the repository

```bash
git clone <repo-url> chalkdust
cd chalkdust
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

Then in the psql shell:

```sql
CREATE DATABASE chalkdust;
\q
```

If using Docker, the database was already created by the `POSTGRES_DB` env var.

### 4. Configure environment variables

Copy the example env file:

```bash
cp .env.local .env.local.bak   # optional: back up the template
```

Edit `.env.local` and fill in your values:

```
# Database connection string
# Adjust user/password/host/port if your PostgreSQL setup differs
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chalkdust

# Which AI provider to use: "openai" or "anthropic"
AI_PROVIDER=openai

# OpenAI API key (required if AI_PROVIDER=openai)
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic API key (required if AI_PROVIDER=anthropic)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

You only need to provide the API key for the provider you selected in `AI_PROVIDER`.

### 5. Push the database schema

This creates all the tables in your PostgreSQL database:

```bash
npx drizzle-kit push
```

You should see output confirming that tables were created (teachers, class_groups, curricula, curriculum_topics, lesson_plans, diary_entries, materials).

### 6. Seed the default teacher

The app currently uses a hardcoded teacher ID (auth is not yet implemented). You need to insert this row so that class creation works:

```bash
psql -U postgres -d chalkdust
```

Then run:

```sql
INSERT INTO teachers (id, name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Lehrkraft', 'demo@chalkdust.de');
\q
```

### 7. Create upload directories

The app stores uploaded PDFs and materials locally:

```bash
mkdir -p public/uploads/curricula public/uploads/materials
```

### 8. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You will land on the marketing page. Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to enter the app, or click any CTA button.

## Using the app

### Create your first class

1. Click **Meine Klassen** in the sidebar
2. Click **Neue Klasse**
3. Fill in the class details (e.g., name: "5a", grade: "5", subject: "Mathematik", school year: "2025/2026")
4. Upload a Kerncurriculum PDF -- the AI will extract topics from it (this requires a working API key)
5. Review and edit the extracted topics, then confirm

### Plan a lesson

1. Open a class from **Meine Klassen**
2. Click **Stunde planen**
3. Fill in the lesson details (date, duration, topic, optional learning goals and notes)
4. Click **Unterrichtsplan erstellen** -- the AI generates a structured plan
5. Use the chat below the plan to refine it (e.g., "Mach die Gruppenarbeit kurzer")
6. Click **Plan freigeben & speichern** to approve

### Review the diary

When a plan is approved, a diary entry is automatically created. Open the **Klassentagebuch** from the class detail page to:

- See all past lessons
- Add notes about what actually happened
- Upload external materials you used
- Update the progress status (completed, partial, deviated)

## Project structure

```
src/
  app/
    (dashboard)/
      classes/                  # Class management
        [id]/
          curriculum/           # Curriculum view
          diary/                # Class diary
          plan/                 # Lesson planning (hybrid form + chat)
        new/                    # New class wizard
      dashboard/                # Dashboard
      lesson-plans/
        [id]/                   # Lesson plan detail
      calendar/                 # Calendar (placeholder)
      ai-assistant/             # AI assistant (placeholder)
    (marketing)/                # Landing page
    api/
      classes/                  # Class CRUD API
      curriculum/upload/        # PDF upload + topic extraction
      lesson-plans/
        generate/               # LLM plan generation
        [id]/
          approve/              # Plan approval
      chat/                     # Chat refinement (streaming + tool-use)
      diary/[id]/               # Diary entry updates
      materials/upload/         # File upload for materials
  components/
    layout/                     # Sidebar, etc.
    ui/                         # shadcn/ui components
  lib/
    db/
      index.ts                  # Drizzle client
      schema.ts                 # Full database schema
    ai/
      index.ts                  # AI provider factory
      schemas.ts                # Zod schemas for LLM output
      context.ts                # Context assembly for prompts
      prompts/                  # System prompts per agent mode
    actions/                    # Server actions (CRUD)
```

## Common tasks

### Reset the database

Drop and recreate all tables:

```bash
npx drizzle-kit push --force
```

Then re-run the seed command from step 6.

### Explore the database

Open Drizzle Studio (a visual DB browser):

```bash
npx drizzle-kit studio
```

### Switch AI providers

Change `AI_PROVIDER` in `.env.local` to `"openai"` or `"anthropic"`, and make sure the corresponding API key is set. Restart the dev server.

### Add a new shadcn/ui component

```bash
npx shadcn@latest add <component-name>
```

### Generate a Drizzle migration

If you change the schema in `src/lib/db/schema.ts`:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| Database | PostgreSQL + Drizzle ORM |
| AI | Vercel AI SDK (OpenAI + Anthropic) |
| PDF parsing | pdf-parse |
| Icons | Lucide React |
| Theming | next-themes (light/dark) |

## Architecture documentation

The full feature architecture -- domain model, UX flows, LLM agent design, system prompts, and requirements -- is documented in:

- [docs/features/lesson-planning.md](docs/features/lesson-planning.md)
