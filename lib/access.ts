import crypto from "crypto";

export const ACCESS_COOKIE_NAME = "icl_access";
export const FREE_COOKIE_NAME = "icl_free_lookup_used";

const ACCESS_TTL_DAYS = 30;

type AccessPayload = {
  plan: "single" | "monthly";
  exp: number;
};

function getSigningSecret() {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "dev-webhook-secret-change-this";
}

function signPayload(base64Payload: string) {
  return crypto.createHmac("sha256", getSigningSecret()).update(base64Payload).digest("hex");
}

export function createAccessToken(plan: AccessPayload["plan"]) {
  const payload: AccessPayload = {
    plan,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TTL_DAYS * 24 * 60 * 60
  };
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export function verifyAccessToken(token: string | undefined): AccessPayload | null {
  if (!token) {
    return null;
  }

  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payloadEncoded);
  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8")) as AccessPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
