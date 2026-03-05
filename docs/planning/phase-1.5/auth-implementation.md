# Phase 1.5 — Clerk Authentication

**Status:** Complete
**Completed:** 2026-03-05

---

## Goal

Replace the `HARDCODED_TEACHER_ID` placeholder with real authentication. Every user must authenticate before accessing the `(dashboard)` — the marketing routes remain public. User identity is resolved from Clerk and joined to an internal `teachers` row on every request.

---

## Technical decisions

### Auth provider: Clerk

Clerk was chosen over Auth.js and Better Auth for this phase because it requires zero boilerplate for Next.js App Router, has native Vercel edge middleware support, and ships with built-in sign-in/sign-up UI. The free tier covers 50,000 monthly regular users. Subscription gating (Stripe) is deferred to a later phase.

### Identity model: `clerkUserId` foreign key

A `clerk_user_id varchar(255) unique` column was added to the `teachers` table. The Clerk `userId` is the canonical external key; all internal queries resolve it to `teachers.id` via `getCurrentTeacherId()`. The Clerk `user.created` webhook auto-creates the `teachers` row on first sign-up.

### Keyless mode

Clerk supports keyless development — the app can start without env vars. Clerk auto-generates temporary keys and shows a "Configure your application" callout in the bottom-right corner. To connect to a real Clerk account, click that callout. Env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) are only required when moving to production or when connecting the webhook.

---

## Work streams

### 1. Clerk setup

- Installed `@clerk/nextjs` and `svix` (webhook verification).
- Added Clerk env vars to `.env.local` and `.env.example` (with `replace_me` placeholders).
- Wrapped `src/app/layout.tsx` `<body>` with `<ClerkProvider>`.

### 2. Proxy (route protection)

`src/proxy.ts` uses `clerkMiddleware()` from `@clerk/nextjs/server`. Next.js 16 renamed the middleware file convention from `middleware.ts` to `proxy.ts`. Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`. All other routes call `auth.protect()`, which redirects unauthenticated users to `/sign-in`.

```ts
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) await auth.protect();
});
```

### 3. Sign-in / sign-up pages

Created `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `sign-up` equivalent using Clerk's `<SignIn />` and `<SignUp />` components. A shared `(auth)/layout.tsx` centers the Clerk UI card on the page.

### 4. Database migration

Added `clerk_user_id varchar(255) unique` to the `teachers` table (`drizzle/0001_jittery_psylocke.sql`). Because the database was originally bootstrapped manually, migration `0000` was recorded as pre-applied and `0001` was applied directly via node.

### 5. `getCurrentTeacherId()` helper

`src/lib/auth.ts` exports a single async function that calls `auth()` from `@clerk/nextjs/server`, reads the Clerk `userId`, and looks up `teachers.id` by `clerk_user_id`. Throws `"Unauthenticated"` if no session, and `"No teacher record found"` if the webhook hasn't created the row yet.

### 6. Webhook — auto-create teacher on sign-up

`src/app/api/webhooks/clerk/route.ts` handles the `user.created` Clerk event. It verifies the Svix signature using `CLERK_WEBHOOK_SECRET`, extracts `id`, `email_addresses`, `first_name`, and `last_name`, and inserts a row into `teachers`.

**Local webhook testing:** use `ngrok http 3000` (or the Svix CLI) to create a tunnel, then register the URL in Clerk Dashboard → Webhooks → Add endpoint.

### 7. Replace `HARDCODED_TEACHER_ID`

Removed the constant and replaced it with `await getCurrentTeacherId()` in all affected files:

| File | Usage |
|---|---|
| `src/lib/actions/class-groups.ts` | `createClassGroup` inserts with real `teacherId` |
| `src/app/(dashboard)/snippets/page.tsx` | `getSnippets(teacherId)` |
| `src/app/api/classes/route.ts` | POST creates class with real `teacherId` |
| `src/app/api/classes/[id]/transition/route.ts` | AI trace `teacherId` |
| `src/app/api/lesson-plans/generate/route.ts` | AI trace `teacherId` |
| `src/app/api/curriculum/upload/route.ts` | AI trace `teacherId` |
| `src/app/api/snippets/route.ts` | GET and POST use real `teacherId` |
| `src/app/api/chat/route.ts` | `createTracedOnFinish` `teacherId` |

---

## API patterns — official Clerk v7 (App Router)

| | Correct |
|---|---|
| Middleware | `clerkMiddleware()` from `@clerk/nextjs/server` |
| Server auth | `const { userId } = await auth()` (async, from `@clerk/nextjs/server`) |
| Client UI | `<Show when="signed-in">` / `<Show when="signed-out">` |
| Provider | `<ClerkProvider>` from `@clerk/nextjs` |
| Avoid | `authMiddleware()`, `<SignedIn>`, `<SignedOut>`, any pages-router patterns |

---

## Success criteria

- [x] Unauthenticated users are redirected to `/sign-in` for all `(dashboard)` routes
- [x] Marketing routes (`/`) are accessible without authentication
- [x] Sign-in and sign-up pages render Clerk's UI components
- [x] `teachers.clerk_user_id` column exists in the database
- [x] `getCurrentTeacherId()` resolves the authenticated teacher ID on every server request
- [x] Clerk webhook creates a `teachers` row on `user.created`
- [x] No file in the codebase contains `HARDCODED_TEACHER_ID`
- [x] App starts in keyless mode without requiring Clerk env vars

---

## Carry-forward: Stripe subscription gating

Subscription gating (block access if no active Stripe subscription) is deferred to Phase 2. When implemented, middleware will check subscription status stored in Clerk user metadata (populated by a Stripe webhook on `customer.subscription.created` / `customer.subscription.deleted`). No structural changes to the auth flow are required — the middleware already has the right shape.
