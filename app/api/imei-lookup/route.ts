import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { consumeLookup, getLookupEntitlement } from "@/lib/database";
import { lookupImei, validateImei } from "@/lib/imei-service";
import { buildCheckoutUrl, SESSION_COOKIE } from "@/lib/lemonsqueezy";

const bodySchema = z.object({
  imei: z.string().min(15).max(30)
});

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please provide a valid IMEI value."
      },
      { status: 400 }
    );
  }

  const imeiValidation = validateImei(parsed.data.imei);
  if (!imeiValidation.valid) {
    return NextResponse.json(
      {
        error: "IMEI must be a valid 15-digit number with a valid check digit."
      },
      { status: 400 }
    );
  }

  const existingSession = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existingSession ?? crypto.randomUUID();

  const entitlement = await getLookupEntitlement(sessionId);

  if (!entitlement.allowed) {
    const singleUrl = buildCheckoutUrl({ plan: "single", sessionId });
    const subscriptionUrl = buildCheckoutUrl({ plan: "subscription", sessionId });

    const paywallResponse = NextResponse.json(
      {
        error: "free_quota_exhausted",
        message:
          "Your free lookup is used. Unlock instant reports with $1 pay-per-lookup or $15/month unlimited.",
        pricing: {
          singleLookup: "$1 per lookup",
          unlimitedMonthly: "$15 per month"
        },
        checkout: {
          single: singleUrl,
          subscription: subscriptionUrl
        },
        entitlement
      },
      { status: 402 }
    );

    if (!existingSession) {
      paywallResponse.cookies.set({
        name: SESSION_COOKIE,
        value: sessionId,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/"
      });
    }

    return paywallResponse;
  }

  const lookupResult = await lookupImei(imeiValidation.normalized);
  const consumption = await consumeLookup(sessionId);
  const updatedEntitlement = await getLookupEntitlement(sessionId);

  const response = NextResponse.json({
    result: lookupResult,
    consumed: consumption.consumed,
    entitlement: updatedEntitlement
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
