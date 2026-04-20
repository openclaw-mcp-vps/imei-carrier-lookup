import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/database";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";

const requestSchema = z.object({
  plan: z.enum(["single", "monthly"])
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const session = await createCheckoutSession(body.plan);
    const checkoutUrl = buildCheckoutUrl({
      plan: body.plan,
      sessionToken: session.token
    });

    return NextResponse.json({
      checkoutUrl,
      sessionToken: session.token
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
