import { NextResponse } from "next/server";

import { getActiveEntitlement } from "@/lib/database";
import { PAID_ACCESS_COOKIE, createPaidAccessToken, paidCookieOptions } from "@/lib/paywall";

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let payload: { email?: string };

  try {
    payload = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() || "";

  if (!validEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter the email used during Stripe checkout." }, { status: 400 });
  }

  const entitlement = await getActiveEntitlement(email);

  if (!entitlement.hasAccess) {
    return NextResponse.json(
      {
        ok: false,
        error: "No active purchase found for that email. Complete checkout first, then try again.",
      },
      { status: 404 },
    );
  }

  const token = createPaidAccessToken(email);
  const response = NextResponse.json({
    ok: true,
    tier: entitlement.tier,
    remainingLookups:
      entitlement.remainingLookups === Number.MAX_SAFE_INTEGER ? null : entitlement.remainingLookups,
    expiresAt: entitlement.expiresAt,
  });

  response.cookies.set(PAID_ACCESS_COOKIE, token, paidCookieOptions);
  return response;
}
