# Authentication

> **Status:** built
> **Created:** 2026-03-05
> **Updated:** 2026-03-05

Chalkdust uses [Clerk](https://clerk.com) as the auth provider. This document describes the complete request-time authentication workflow and every edge case handled by the implementation.

---

## System overview

```
Browser request
    │
    ▼
proxy.ts (clerkMiddleware)
    │  public route? → pass through
    │  protected route? → auth.protect() → redirect to /sign-in if no session
    ▼
Route handler / Server Action / RSC
    │
    ▼
getCurrentTeacherId()       ← src/lib/auth.ts
    │  1. auth() → Clerk userId
    │  2. DB lookup by clerk_user_id → teachers.id   (fast path)
    │  3. [miss] currentUser() → Clerk profile        (provision path)
    │  4. [miss] DB lookup by email → backfill         (email-match path)
    │  5. [miss] INSERT ... ON CONFLICT DO NOTHING     (insert path)
    │  6. [nothing inserted] re-fetch                  (race-condition path)
    ▼
teachers.id (UUID)
```

All protected server code calls `getCurrentTeacherId()` to obtain `teachers.id`. The Clerk `userId` is never used as a foreign key inside the database — it is only an index into the `teachers` table.

---

## Route protection — `src/proxy.ts`

Next.js 16 uses `proxy.ts` as the middleware file name (previously `middleware.ts`).

**Public routes** (no authentication required):

| Pattern | Matches |
|---|---|
| `/` | Marketing landing page |
| `/sign-in(.*)` | Clerk sign-in (catch-all including deep paths) |
| `/sign-up(.*)` | Clerk sign-up |
| `/api/webhooks(.*)` | Clerk `user.created` webhook — must be public so Clerk can POST to it |

Every other route calls `auth.protect()`, which redirects unauthenticated users to `/sign-in` automatically (Clerk inserts a `redirect_url` parameter so the user lands on the originally requested page after sign-in).

**Matcher** — the middleware runs on all paths except:
- `_next` internal files
- Static assets: `.html`, `.css`, `.js` (but not `.json`), images, fonts, manifests
- All `api` and `trpc` paths are always included regardless of static-asset exclusion.

---

## Sign-in / sign-up UI

`src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` renders Clerk's `<SignIn />` component. `[[...sign-in]]` is a catch-all segment so that Clerk's multi-step flow (which appends path segments) resolves to the same page. The equivalent exists for sign-up.

`src/app/(auth)/layout.tsx` provides a full-viewport centred container shared by both pages.

`<ClerkProvider>` in `src/app/layout.tsx` wraps the entire application tree, making Clerk's React context available to every client component.

---

## `teachers` table schema

```
teachers
  id            uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
  clerk_user_id varchar(255)  UNIQUE  NULLABLE
  name          varchar(255)  NOT NULL
  email         varchar(255)  NOT NULL  UNIQUE
  created_at    timestamp  NOT NULL  DEFAULT now()
```

`clerk_user_id` is nullable to support rows that were seeded manually or created before the column was added. It is unique to enforce a one-to-one mapping between Clerk accounts and teacher records.

---

## Webhook — `src/app/api/webhooks/clerk/route.ts`

Handles the Clerk `user.created` event and inserts a `teachers` row automatically so that `getCurrentTeacherId()` finds it on the first dashboard request.

**Verification:** The route uses the [Svix](https://svix.com) library to verify the HMAC signature on every incoming request using `CLERK_WEBHOOK_SECRET`. Requests with missing or invalid Svix headers are rejected with `400`. If `CLERK_WEBHOOK_SECRET` is not set, the route returns `500` immediately rather than silently accepting unsigned payloads.

**Insert logic:**
1. Extracts `id` (Clerk userId), `email_addresses`, `first_name`, `last_name` from the event payload.
2. Resolves the primary email from `primary_email_address_id`.
3. Constructs `name` as `"${first_name} ${last_name}".trim()`, falling back to the local part of the email if both name fields are absent.
4. Inserts `{ clerkUserId: id, name, email }` into `teachers`. No conflict handling — a duplicate `user.created` event for the same Clerk user will throw a unique constraint violation (acceptable; Clerk does not replay `user.created`).

**Edge case — webhook not configured:** If `CLERK_WEBHOOK_SECRET` is absent or the webhook is not registered in Clerk Dashboard, no row is created on sign-up. `getCurrentTeacherId()` handles this case (see provision path below).

---

## `getCurrentTeacherId()` — `src/lib/auth.ts`

This is the single function all protected server code calls. It returns `teachers.id` (a UUID) and handles six cases in order:

### Step 1 — Verify Clerk session

```ts
const { userId } = await auth();
if (!userId) throw new Error("Unauthenticated");
```

`auth()` reads the Clerk session token from the request cookie/header. If there is no valid session, `userId` is `null` and the function throws `"Unauthenticated"`. In practice the middleware has already redirected unauthenticated users, so this branch is a defence-in-depth guard for direct API calls.

### Step 2 — Fast path: DB lookup by `clerk_user_id`

```ts
const rows = await db.select({ id: teachers.id })
  .from(teachers).where(eq(teachers.clerkUserId, userId)).limit(1);
if (rows[0]) return rows[0].id;
```

This is the hot path for every request after initial provisioning. One indexed query resolves the Clerk external ID to an internal UUID.

### Step 3 — Provision path: fetch Clerk profile

When step 2 misses, the teacher row does not yet exist (webhook not configured, webhook delayed, or first-ever sign-up before step 4/5 below). The function calls `currentUser()` to obtain the Clerk user profile needed for auto-provisioning.

**Edge case — Clerk 404 on fresh sign-up:** Immediately after sign-up, a session token is issued but the Clerk API may not have finished propagating the user profile. `currentUser()` returns a Clerk API 404. When this happens the function catches the error (detected via `err.clerkError === true && err.status === 404`) and calls `redirect("/sign-in")`. This forces the browser to re-initiate the session flow, after which the profile will be available.

If `currentUser()` returns `null` for any other reason, throws `"Unauthenticated"`.

### Step 4 — Email-match path: backfill `clerk_user_id`

```ts
const byEmail = await db.select({ id: teachers.id })
  .from(teachers).where(eq(teachers.email, email)).limit(1);
if (byEmail[0]) {
  await db.update(teachers).set({ clerkUserId: userId }).where(eq(teachers.id, byEmail[0].id));
  return byEmail[0].id;
}
```

Handles two sub-cases:
- **Webhook created the row but without `clerk_user_id`** (impossible with the current webhook implementation, but guarded defensively).
- **Row was manually seeded** (e.g. a dev environment where the DB was bootstrapped with a known email before any auth was configured).

When a match is found by email, the row is backfilled with the Clerk `userId` so that future requests take the fast path (step 2).

### Step 5 — Insert path: create the row

```ts
const inserted = await db.insert(teachers)
  .values({ clerkUserId: userId, name, email })
  .onConflictDoNothing()
  .returning({ id: teachers.id });
if (inserted[0]) return inserted[0].id;
```

**`ON CONFLICT DO NOTHING`** handles concurrent requests. If two server functions call `getCurrentTeacherId()` in parallel (e.g. `Promise.all`) before either insert is committed, only one insert wins; the other silently discards its insert and falls through to step 6. Without this clause, the losing request would throw a unique constraint violation.

### Step 6 — Race-condition recovery: re-fetch

```ts
const [existing] = await db.select({ id: teachers.id })
  .from(teachers).where(eq(teachers.clerkUserId, userId)).limit(1);
return existing.id;
```

Reached only when the insert in step 5 returned nothing (another concurrent request won the race). The row now exists; a second lookup retrieves it. There is no further error handling here — if this lookup also fails, the query throws a runtime error (indicates a deeper DB problem).

---

## Name resolution logic (webhook and provision path)

Both the webhook handler and the provision path in `getCurrentTeacherId()` use identical name-resolution logic:

```ts
const name = [first_name, last_name].filter(Boolean).join(" ").trim()
             || email.split("@")[0];
```

If both `first_name` and `last_name` are absent or empty, the local part of the email address is used as a fallback name.

---

## Keyless development mode

Clerk supports running without env vars. When `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are absent, Clerk auto-generates temporary keys and renders a "Configure your application" callout. In this mode:
- The full auth flow (sign-in, session resolution, `auth()`) works normally.
- The webhook does **not** work — `CLERK_WEBHOOK_SECRET` is required for webhook verification, and there is no Clerk Dashboard to register an endpoint against. Teacher rows must be provisioned via the fallback logic in `getCurrentTeacherId()` (steps 3–6).

---

## Error surface

| Error | Source | Meaning |
|---|---|---|
| `"Unauthenticated"` | `getCurrentTeacherId()` step 1 | No valid Clerk session; middleware should have redirected before this is reached |
| `"Unauthenticated"` | `getCurrentTeacherId()` step 3 | `currentUser()` returned null despite a valid session token |
| Clerk 404 → `redirect("/sign-in")` | `getCurrentTeacherId()` step 3 | Profile propagation race on fresh sign-up; resolved by re-auth |
| `500 CLERK_WEBHOOK_SECRET not set` | Webhook handler | Env var missing in production |
| `400 Missing svix headers` | Webhook handler | Request arrived without Svix signature headers (not from Clerk) |
| `400 Invalid webhook signature` | Webhook handler | Signature verification failed (tampered or wrong secret) |
