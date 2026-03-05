import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Returns the internal teachers.id for the currently authenticated Clerk user.
 * If no teacher row exists yet (e.g. webhook not configured), auto-provisions one
 * using the Clerk user profile. Throws if the user is not authenticated.
 */
export async function getCurrentTeacherId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const rows = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);

  if (rows[0]) return rows[0].id;

  let user;
  try {
    user = await currentUser();
  } catch (err: unknown) {
    // Race condition on fresh sign-up: session token exists but Clerk hasn't
    // propagated the user profile yet. Redirect to sign-in to retry.
    if (
      err &&
      typeof err === "object" &&
      "clerkError" in err &&
      (err as { status?: number }).status === 404
    ) {
      redirect("/sign-in");
    }
    throw err;
  }
  if (!user) throw new Error("Unauthenticated");

  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  );
  const email = primaryEmail?.emailAddress ?? "";
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0];

  // Check for an existing row matched by email (e.g. webhook created it without
  // clerk_user_id, or the column was added after the row was seeded).
  if (email) {
    const byEmail = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.email, email))
      .limit(1);

    if (byEmail[0]) {
      await db
        .update(teachers)
        .set({ clerkUserId: userId })
        .where(eq(teachers.id, byEmail[0].id));
      return byEmail[0].id;
    }
  }

  // Use ON CONFLICT DO NOTHING to handle concurrent inserts (e.g. Promise.all
  // calling getCurrentTeacherId twice before either row is committed).
  const inserted = await db
    .insert(teachers)
    .values({ clerkUserId: userId, name, email })
    .onConflictDoNothing()
    .returning({ id: teachers.id });

  if (inserted[0]) return inserted[0].id;

  // Another concurrent request won the race — re-fetch the now-existing row.
  const [existing] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);

  return existing.id;
}
