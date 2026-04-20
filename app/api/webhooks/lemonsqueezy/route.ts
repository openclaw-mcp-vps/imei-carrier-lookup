import { NextResponse } from "next/server";
import { extractSessionTokenFromWebhook, verifyLemonSignature } from "@/lib/lemonsqueezy";
import { markCheckoutSessionPaid } from "@/lib/database";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  const eventName = (meta?.event_name as string | undefined) || "";

  if (eventName === "order_created" || eventName === "subscription_created") {
    const sessionToken = extractSessionTokenFromWebhook(payload);

    if (sessionToken) {
      const data = payload.data as Record<string, unknown> | undefined;
      const attributes = data?.attributes as Record<string, unknown> | undefined;
      await markCheckoutSessionPaid({
        token: sessionToken,
        orderId: data?.id ? String(data.id) : undefined,
        buyerEmail: attributes?.user_email ? String(attributes.user_email) : undefined
      });
    }
  }

  return NextResponse.json({ received: true });
}
