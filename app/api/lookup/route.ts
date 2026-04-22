import { NextResponse } from "next/server";

import { consumeSingleLookup, getActiveEntitlement } from "@/lib/database";
import { lookupImeiDetails } from "@/lib/imei-service";
import {
  FREE_LOOKUP_COOKIE,
  PAID_ACCESS_COOKIE,
  freeCookieOptions,
  verifyPaidAccessToken,
} from "@/lib/paywall";
import { LookupApiResponse, LookupErrorResponse, LookupSuccessResponse } from "@/lib/types";

function extractCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const [key, ...rest] = pair.split("=");
      if (!key) {
        return acc;
      }
      acc[key] = rest.join("=");
      return acc;
    }, {});
}

function paywallError(message: string): LookupErrorResponse {
  return {
    ok: false,
    error: message,
    paywall: {
      required: true,
      paymentLink: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK,
      message,
    },
  };
}

export async function POST(request: Request) {
  let body: { imei?: string };

  try {
    body = (await request.json()) as { imei?: string };
  } catch {
    return NextResponse.json<LookupApiResponse>(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const rawImei = body.imei ?? "";
  const imei = rawImei.replace(/\D/g, "");

  if (imei.length !== 15) {
    return NextResponse.json<LookupApiResponse>(
      { ok: false, error: "IMEI must contain exactly 15 digits." },
      { status: 400 },
    );
  }

  const cookies = extractCookies(request.headers.get("cookie"));
  const paidTokenStatus = verifyPaidAccessToken(cookies[PAID_ACCESS_COOKIE]);
  const hasFreeLookupUsed = cookies[FREE_LOOKUP_COOKIE] === "1";

  let responseAccess: LookupSuccessResponse["access"] = {
    mode: "free",
    remainingLookups: 0,
  };
  let clearPaidCookie = false;
  let setFreeCookie = false;

  if (paidTokenStatus.valid && paidTokenStatus.email) {
    const entitlement = await getActiveEntitlement(paidTokenStatus.email);

    if (!entitlement.hasAccess) {
      clearPaidCookie = true;

      return NextResponse.json<LookupApiResponse>(
        paywallError("Your paid credit is exhausted. Buy another lookup or monthly plan to continue."),
        { status: 402 },
      );
    }

    if (entitlement.tier === "single") {
      const consumed = await consumeSingleLookup(paidTokenStatus.email);

      if (!consumed.allowed) {
        clearPaidCookie = true;

        return NextResponse.json<LookupApiResponse>(
          paywallError("Your paid credit is exhausted. Buy another lookup or monthly plan to continue."),
          { status: 402 },
        );
      }

      responseAccess = {
        mode: "single-paid",
        remainingLookups: consumed.remainingLookups,
      };
    } else {
      responseAccess = {
        mode: "unlimited-paid",
        remainingLookups: null,
      };
    }
  } else if (!hasFreeLookupUsed) {
    setFreeCookie = true;
    responseAccess = {
      mode: "free",
      remainingLookups: 0,
    };
  } else {
    return NextResponse.json<LookupApiResponse>(
      paywallError("Free lookup already used. Unlock more checks with Stripe to continue."),
      { status: 402 },
    );
  }

  const lookup = await lookupImeiDetails(imei);

  const response = NextResponse.json<LookupApiResponse>(
    {
      ok: true,
      data: lookup,
      access: responseAccess,
    },
    { status: 200 },
  );

  if (setFreeCookie) {
    response.cookies.set(FREE_LOOKUP_COOKIE, "1", freeCookieOptions);
  }

  if (clearPaidCookie) {
    response.cookies.delete(PAID_ACCESS_COOKIE);
  }

  return response;
}
