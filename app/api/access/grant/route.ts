import { NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE_NAME, createAccessToken } from "@/lib/access";
import { getCheckoutSession } from "@/lib/database";

const schema = z.object({
  sessionToken: z.string().min(10)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const session = await getCheckoutSession(body.sessionToken);

    if (!session || session.status !== "paid") {
      return NextResponse.json(
        {
          error: "Payment is still processing. Retry in a few seconds."
        },
        { status: 409 }
      );
    }

    const accessToken = createAccessToken(session.plan);
    const response = NextResponse.json({ granted: true, plan: session.plan });

    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/"
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to grant access.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
