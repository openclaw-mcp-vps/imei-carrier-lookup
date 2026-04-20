import crypto from "crypto";
import type { CheckoutPlan } from "@/lib/database";

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getPlanCheckoutId(plan: CheckoutPlan) {
  if (plan === "monthly") {
    return (
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_MONTHLY_PRODUCT_ID ||
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID ||
      ""
    );
  }
  return process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID || "";
}

export function buildCheckoutUrl(input: { plan: CheckoutPlan; sessionToken: string }) {
  const checkoutId = getPlanCheckoutId(input.plan);
  if (!checkoutId) {
    throw new Error("Missing Lemon Squeezy product identifier environment variable.");
  }

  const url = new URL(`https://checkout.lemonsqueezy.com/buy/${checkoutId}`);
  url.searchParams.set("checkout[custom][session_token]", input.sessionToken);
  url.searchParams.set("checkout[custom][plan]", input.plan);
  url.searchParams.set("checkout[success_url]", `${getAppUrl()}?checkout=success&session=${input.sessionToken}`);
  url.searchParams.set("checkout[cancel_url]", `${getAppUrl()}?checkout=canceled`);

  return url.toString();
}

export function verifyLemonSignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) {
    return false;
  }

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (digest.length !== signatureHeader.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}

export function extractSessionTokenFromWebhook(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const safe = payload as Record<string, unknown>;
  const meta = safe.meta as Record<string, unknown> | undefined;
  const customData = meta?.custom_data as Record<string, unknown> | undefined;

  if (typeof customData?.session_token === "string") {
    return customData.session_token;
  }

  const data = safe.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const firstOrderItem = attributes?.first_order_item as Record<string, unknown> | undefined;
  const checkoutData = firstOrderItem?.checkout_data as Record<string, unknown> | undefined;
  const custom = checkoutData?.custom as Record<string, unknown> | undefined;

  if (typeof custom?.session_token === "string") {
    return custom.session_token;
  }

  return null;
}
