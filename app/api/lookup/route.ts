import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, FREE_COOKIE_NAME, verifyAccessToken } from "@/lib/access";
import { lookupImei } from "@/lib/imei-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imei?: string };
    const imei = body.imei?.trim() || "";

    if (!imei) {
      return NextResponse.json({ error: "IMEI is required." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const paidToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    const access = verifyAccessToken(paidToken);
    const usedFreeLookup = cookieStore.get(FREE_COOKIE_NAME)?.value === "1";

    if (!access && usedFreeLookup) {
      return NextResponse.json(
        {
          error:
            "Your free lookup has been used. Unlock additional checks with pay-as-you-go or monthly unlimited.",
          needsPayment: true
        },
        { status: 402 }
      );
    }

    const result = await lookupImei(imei);
    const response = NextResponse.json({ result });

    if (!access && !usedFreeLookup) {
      response.cookies.set(FREE_COOKIE_NAME, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/"
      });
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
