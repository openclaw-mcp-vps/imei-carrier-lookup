import { NextRequest, NextResponse } from "next/server";

import {
  grantSingleLookup,
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  setSubscriptionStatus
} from "@/lib/database";
import {
  extractEventName,
  extractPlan,
  extractSessionId,
  LemonWebhookPayload,
  verifyLemonWebhookSignature
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    const valid = verifyLemonWebhookSignature(rawBody, signature);

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody || "{}") as LemonWebhookPayload;
  const eventName = extractEventName(payload);
  const eventId = payload.data?.id ?? `${eventName}:${Date.now()}`;

  if (await hasProcessedWebhookEvent(eventId)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const sessionId = extractSessionId(payload);
  const plan = extractPlan(payload);
  const email = payload.data?.attributes?.user_email;

  if (!sessionId) {
    await markWebhookEventProcessed(eventId);
    return NextResponse.json({ ok: true, ignored: "missing_session_id" });
  }

  switch (eventName) {
    case "order_created": {
      if (plan === "subscription") {
        await setSubscriptionStatus(
          sessionId,
          true,
          payload.data?.attributes?.renews_at ?? payload.data?.attributes?.ends_at ?? null,
          email
        );
      } else {
        await grantSingleLookup(sessionId, 1, email);
      }
      break;
    }

    case "order_refunded": {
      if (plan === "subscription") {
        await setSubscriptionStatus(sessionId, false, payload.data?.attributes?.ends_at ?? null, email);
      } else {
        await grantSingleLookup(sessionId, -1, email);
      }
      break;
    }

    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed": {
      await setSubscriptionStatus(
        sessionId,
        true,
        payload.data?.attributes?.renews_at ?? payload.data?.attributes?.ends_at ?? null,
        email
      );
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_paused": {
      await setSubscriptionStatus(sessionId, false, payload.data?.attributes?.ends_at ?? null, email);
      break;
    }

    default:
      break;
  }

  await markWebhookEventProcessed(eventId);

  return NextResponse.json({ ok: true, event: eventName });
}
