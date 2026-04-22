import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AccessTier, ActiveEntitlement } from "@/lib/types";

interface PurchaseRecord {
  id: string;
  email: string;
  tier: AccessTier;
  creditsRemaining: number | null;
  expiresAt: string | null;
  status: "active" | "expired" | "revoked";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  purchases: PurchaseRecord[];
  processedWebhookEventIds: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "paywall-store.json");

let memoryStore: StoreShape = {
  purchases: [],
  processedWebhookEventIds: [],
};

function nowIso() {
  return new Date().toISOString();
}

function isFutureOrNull(dateStr: string | null): boolean {
  if (!dateStr) {
    return true;
  }

  return new Date(dateStr).getTime() > Date.now();
}

function buildId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function loadStore(): Promise<StoreShape> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;

    if (!parsed.purchases || !parsed.processedWebhookEventIds) {
      return memoryStore;
    }

    memoryStore = parsed;
    return parsed;
  } catch {
    return memoryStore;
  }
}

async function saveStore(store: StoreShape): Promise<void> {
  memoryStore = store;

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Ignore write errors in read-only environments and continue with in-memory storage.
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getActiveUnlimitedRecord(records: PurchaseRecord[]): PurchaseRecord | null {
  const current = records.find(
    (record) => record.tier === "unlimited" && record.status === "active" && isFutureOrNull(record.expiresAt),
  );

  return current ?? null;
}

function sumActiveSingleCredits(records: PurchaseRecord[]): number {
  return records
    .filter((record) => record.tier === "single" && record.status === "active" && isFutureOrNull(record.expiresAt))
    .reduce((total, record) => total + (record.creditsRemaining ?? 0), 0);
}

export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  const store = await loadStore();
  return store.processedWebhookEventIds.includes(eventId);
}

export async function markWebhookEventProcessed(eventId: string): Promise<void> {
  const store = await loadStore();

  if (!store.processedWebhookEventIds.includes(eventId)) {
    store.processedWebhookEventIds.push(eventId);
    await saveStore(store);
  }
}

export async function recordCheckoutPurchase(input: {
  email: string;
  mode: "payment" | "subscription";
  amountTotalInCents: number | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSessionId?: string | null;
}): Promise<void> {
  const store = await loadStore();
  const email = normalizeEmail(input.email);

  if (!email) {
    return;
  }

  const createdAt = nowIso();

  if (input.mode === "subscription") {
    const renewalDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

    const existing = store.purchases.find(
      (record) =>
        record.email === email &&
        record.tier === "unlimited" &&
        record.status === "active" &&
        (input.stripeSubscriptionId ? record.stripeSubscriptionId === input.stripeSubscriptionId : true),
    );

    if (existing) {
      existing.expiresAt = renewalDate;
      existing.updatedAt = createdAt;
      existing.stripeCustomerId = input.stripeCustomerId ?? existing.stripeCustomerId;
      existing.stripeSessionId = input.stripeSessionId ?? existing.stripeSessionId;
    } else {
      store.purchases.push({
        id: buildId("sub"),
        email,
        tier: "unlimited",
        creditsRemaining: null,
        expiresAt: renewalDate,
        status: "active",
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        stripeSessionId: input.stripeSessionId ?? null,
        createdAt,
        updatedAt: createdAt,
      });
    }
  } else {
    const credits = Math.max(1, Math.floor((input.amountTotalInCents ?? 100) / 100));
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    store.purchases.push({
      id: buildId("single"),
      email,
      tier: "single",
      creditsRemaining: credits,
      expiresAt,
      status: "active",
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      stripeSessionId: input.stripeSessionId ?? null,
      createdAt,
      updatedAt: createdAt,
    });
  }

  await saveStore(store);
}

export async function extendSubscriptionFromInvoice(input: {
  email?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<void> {
  const store = await loadStore();
  const renewedUntil = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

  const match = store.purchases.find(
    (record) =>
      record.tier === "unlimited" &&
      record.status === "active" &&
      ((input.stripeSubscriptionId && record.stripeSubscriptionId === input.stripeSubscriptionId) ||
        (input.stripeCustomerId && record.stripeCustomerId === input.stripeCustomerId) ||
        (input.email && record.email === normalizeEmail(input.email))),
  );

  if (!match) {
    return;
  }

  match.expiresAt = renewedUntil;
  match.updatedAt = nowIso();
  await saveStore(store);
}

export async function revokeSubscription(input: {
  email?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<void> {
  const store = await loadStore();

  for (const record of store.purchases) {
    const matched =
      record.tier === "unlimited" &&
      record.status === "active" &&
      ((input.stripeSubscriptionId && record.stripeSubscriptionId === input.stripeSubscriptionId) ||
        (input.stripeCustomerId && record.stripeCustomerId === input.stripeCustomerId) ||
        (input.email && record.email === normalizeEmail(input.email)));

    if (matched) {
      record.status = "revoked";
      record.updatedAt = nowIso();
      record.expiresAt = nowIso();
    }
  }

  await saveStore(store);
}

export async function getActiveEntitlement(email: string): Promise<ActiveEntitlement> {
  const store = await loadStore();
  const normalized = normalizeEmail(email);
  const records = store.purchases.filter((record) => record.email === normalized);

  const unlimited = getActiveUnlimitedRecord(records);

  if (unlimited) {
    return {
      hasAccess: true,
      tier: "unlimited",
      remainingLookups: Number.MAX_SAFE_INTEGER,
      expiresAt: unlimited.expiresAt,
    };
  }

  const credits = sumActiveSingleCredits(records);

  return {
    hasAccess: credits > 0,
    tier: credits > 0 ? "single" : null,
    remainingLookups: credits,
    expiresAt: null,
  };
}

export async function consumeSingleLookup(email: string): Promise<{ allowed: boolean; remainingLookups: number }> {
  const store = await loadStore();
  const normalized = normalizeEmail(email);

  const unlimited = getActiveUnlimitedRecord(store.purchases.filter((record) => record.email === normalized));

  if (unlimited) {
    return { allowed: true, remainingLookups: Number.MAX_SAFE_INTEGER };
  }

  const candidate = store.purchases.find(
    (record) =>
      record.email === normalized &&
      record.tier === "single" &&
      record.status === "active" &&
      isFutureOrNull(record.expiresAt) &&
      (record.creditsRemaining ?? 0) > 0,
  );

  if (!candidate) {
    return { allowed: false, remainingLookups: 0 };
  }

  candidate.creditsRemaining = Math.max(0, (candidate.creditsRemaining ?? 0) - 1);
  candidate.updatedAt = nowIso();

  if ((candidate.creditsRemaining ?? 0) === 0) {
    candidate.status = "expired";
  }

  await saveStore(store);

  const remainingLookups = sumActiveSingleCredits(
    store.purchases.filter((record) => record.email === normalized && record.status === "active"),
  );

  return {
    allowed: true,
    remainingLookups,
  };
}
