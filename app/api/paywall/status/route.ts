import { NextResponse } from "next/server";

import { getActiveEntitlement } from "@/lib/database";
import { FREE_LOOKUP_COOKIE, PAID_ACCESS_COOKIE, verifyPaidAccessToken } from "@/lib/paywall";

export async function GET(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const paidCookie =
    cookies
      .split(";")
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith(`${PAID_ACCESS_COOKIE}=`))
      ?.split("=")
      .slice(1)
      .join("=") ?? "";

  const freeCookie =
    cookies
      .split(";")
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith(`${FREE_LOOKUP_COOKIE}=`))
      ?.split("=")
      .slice(1)
      .join("=") ?? "";

  const tokenStatus = verifyPaidAccessToken(paidCookie || undefined);

  if (tokenStatus.valid && tokenStatus.email) {
    const entitlement = await getActiveEntitlement(tokenStatus.email);

    return NextResponse.json({
      hasAccess: entitlement.hasAccess,
      tier: entitlement.tier,
      remainingLookups:
        entitlement.remainingLookups === Number.MAX_SAFE_INTEGER ? null : entitlement.remainingLookups,
      expiresAt: entitlement.expiresAt,
      freeLookupUsed: freeCookie === "1",
      verifiedEmail: tokenStatus.email,
    });
  }

  return NextResponse.json({
    hasAccess: false,
    tier: null,
    remainingLookups: 0,
    expiresAt: null,
    freeLookupUsed: freeCookie === "1",
    verifiedEmail: null,
  });
}
