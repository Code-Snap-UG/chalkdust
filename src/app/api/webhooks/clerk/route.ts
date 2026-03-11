import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { log } from "@/lib/logger";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    log.error("webhook.clerk", {
      error: new Error("CLERK_WEBHOOK_SECRET not set"),
      expected: "Environment variable should be configured",
    });
    return new Response("CLERK_WEBHOOK_SECRET not set", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    log.error("webhook.clerk.verify", {
      error,
      expected: "Valid webhook signature",
    });
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = event.data;

    const primaryEmail = email_addresses.find(
      (e) => e.id === event.data.primary_email_address_id
    );
    const email = primaryEmail?.email_address ?? "";
    const name =
      [first_name, last_name].filter(Boolean).join(" ").trim() ||
      email.split("@")[0];

    await db.insert(teachers).values({
      clerkUserId: id,
      name,
      email,
    });
  }

  return new Response("OK", { status: 200 });
}
