import crypto from "node:crypto";

export const SESSION_COOKIE = "imei_session";

type CheckoutPlan = "single" | "subscription";

type BuildCheckoutUrlParams = {
  plan: CheckoutPlan;
  sessionId: string;
  email?: string;
};

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      session_id?: string;
      plan?: CheckoutPlan;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      user_email?: string;
      ends_at?: string | null;
      renews_at?: string | null;
      status?: string;
      custom_data?: {
        session_id?: string;
        plan?: CheckoutPlan;
      };
      first_order_item?: {
        custom_data?: {
          session_id?: string;
          plan?: CheckoutPlan;
        };
      };
    };
  };
};

function resolveCheckoutHandle(plan: CheckoutPlan): string | null {
  const raw = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID?.trim();

  if (!raw) {
    return null;
  }

  if (raw.includes(",")) {
    const [single, subscription] = raw.split(",").map((entry) => entry.trim());
    if (plan === "subscription") {
      return subscription || single || null;
    }
    return single || null;
  }

  return raw;
}

export function buildCheckoutUrl({
  plan,
  sessionId,
  email
}: BuildCheckoutUrlParams): string | null {
  const handle = resolveCheckoutHandle(plan);

  if (!handle) {
    return null;
  }

  const isAbsoluteUrl = /^https?:\/\//i.test(handle);
  const url = new URL(
    isAbsoluteUrl ? handle : `https://checkout.lemonsqueezy.com/buy/${handle}`
  );

  url.searchParams.set("embed", "1");
  url.searchParams.set("media", "0");
  url.searchParams.set("logo", "0");
  url.searchParams.set("checkout[custom][session_id]", sessionId);
  url.searchParams.set("checkout[custom][plan]", plan);

  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID?.trim();
  if (storeId) {
    url.searchParams.set("checkout[custom][store_id]", storeId);
  }

  if (email) {
    url.searchParams.set("checkout[email]", email);
  }

  return url.toString();
}

export function verifyLemonWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();

  if (!secret || !signatureHeader) {
    return false;
  }

  const signature = signatureHeader.includes("=")
    ? signatureHeader.split("=").at(-1) ?? ""
    : signatureHeader;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (digest.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export function extractSessionId(payload: LemonWebhookPayload): string | null {
  return (
    payload.meta?.custom_data?.session_id ??
    payload.data?.attributes?.custom_data?.session_id ??
    payload.data?.attributes?.first_order_item?.custom_data?.session_id ??
    null
  );
}

export function extractPlan(payload: LemonWebhookPayload): CheckoutPlan {
  return (
    payload.meta?.custom_data?.plan ??
    payload.data?.attributes?.custom_data?.plan ??
    payload.data?.attributes?.first_order_item?.custom_data?.plan ??
    "single"
  );
}

export function extractEventName(payload: LemonWebhookPayload): string {
  return payload.meta?.event_name ?? "unknown";
}
