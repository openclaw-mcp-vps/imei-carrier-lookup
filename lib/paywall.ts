import { createHmac, timingSafeEqual } from "node:crypto";

export const PAID_ACCESS_COOKIE = "imei_paid_access";
export const FREE_LOOKUP_COOKIE = "imei_free_lookup_used";

interface PaidAccessPayload {
  email: string;
  iat: number;
}

function getCookieSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "dev-paywall-secret";
}

function encodePayload(payload: PaidAccessPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getCookieSecret()).update(encodedPayload).digest("base64url");
}

export function createPaidAccessToken(email: string): string {
  const payload: PaidAccessPayload = {
    email: email.trim().toLowerCase(),
    iat: Date.now(),
  };

  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyPaidAccessToken(token: string | undefined): { valid: boolean; email: string | null } {
  if (!token) {
    return { valid: false, email: null };
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return { valid: false, email: null };
  }

  const expectedSignature = signPayload(encodedPayload);

  const safeMatch =
    expectedSignature.length === signature.length &&
    timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  if (!safeMatch) {
    return { valid: false, email: null };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as PaidAccessPayload;

    if (!payload.email || typeof payload.email !== "string") {
      return { valid: false, email: null };
    }

    return {
      valid: true,
      email: payload.email.trim().toLowerCase(),
    };
  } catch {
    return { valid: false, email: null };
  }
}

export const paidCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export const freeCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
