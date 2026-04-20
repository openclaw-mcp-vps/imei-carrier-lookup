import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { buildCheckoutUrl, SESSION_COOKIE } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export function GET(request: NextRequest): NextResponse {
  const rawPlan = request.nextUrl.searchParams.get("plan");
  const plan = rawPlan === "subscription" ? "subscription" : "single";

  const existingSession = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existingSession ?? crypto.randomUUID();

  const url = buildCheckoutUrl({
    plan,
    sessionId
  });

  if (!url) {
    return NextResponse.json(
      {
        error:
          "Lemon Squeezy checkout is not configured. Set NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID."
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    url,
    plan
  });

  if (!existingSession) {
    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/"
    });
  }

  return response;
}
