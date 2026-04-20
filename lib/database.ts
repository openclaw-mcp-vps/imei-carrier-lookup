import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "store.json");
const FREE_LOOKUPS_PER_SESSION = 1;

export type LookupConsumptionType = "free" | "paid" | "subscription";

type SessionRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  freeLookupsUsed: number;
  paidLookupsRemaining: number;
  subscriptionActive: boolean;
  subscriptionEndsAt: string | null;
  email: string | null;
};

type DatabaseShape = {
  sessions: Record<string, SessionRecord>;
  processedWebhookEvents: Record<string, string>;
};

const EMPTY_DB: DatabaseShape = {
  sessions: {},
  processedWebhookEvents: {}
};

let lock: Promise<unknown> = Promise.resolve();

function nowIso(): string {
  return new Date().toISOString();
}

async function ensureDbFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf8");
  }
}

async function readDb(): Promise<DatabaseShape> {
  await ensureDbFile();

  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DatabaseShape>;

    return {
      sessions: parsed.sessions ?? {},
      processedWebhookEvents: parsed.processedWebhookEvents ?? {}
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDb(db: DatabaseShape): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const task = lock.then(fn, fn);
  lock = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

function upsertSession(db: DatabaseShape, sessionId: string): SessionRecord {
  const existing = db.sessions[sessionId];

  if (existing) {
    return existing;
  }

  const session: SessionRecord = {
    id: sessionId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    freeLookupsUsed: 0,
    paidLookupsRemaining: 0,
    subscriptionActive: false,
    subscriptionEndsAt: null,
    email: null
  };

  db.sessions[sessionId] = session;
  return session;
}

export async function getLookupEntitlement(sessionId: string): Promise<{
  allowed: boolean;
  freeLookupsRemaining: number;
  paidLookupsRemaining: number;
  subscriptionActive: boolean;
}> {
  return withLock(async () => {
    const db = await readDb();
    const session = upsertSession(db, sessionId);

    const freeLookupsRemaining = Math.max(
      FREE_LOOKUPS_PER_SESSION - session.freeLookupsUsed,
      0
    );

    const allowed =
      session.subscriptionActive ||
      session.paidLookupsRemaining > 0 ||
      freeLookupsRemaining > 0;

    await writeDb(db);

    return {
      allowed,
      freeLookupsRemaining,
      paidLookupsRemaining: session.paidLookupsRemaining,
      subscriptionActive: session.subscriptionActive
    };
  });
}

export async function consumeLookup(
  sessionId: string
): Promise<{ consumed: LookupConsumptionType }> {
  return withLock(async () => {
    const db = await readDb();
    const session = upsertSession(db, sessionId);

    let consumed: LookupConsumptionType;

    if (session.subscriptionActive) {
      consumed = "subscription";
    } else if (session.paidLookupsRemaining > 0) {
      session.paidLookupsRemaining -= 1;
      consumed = "paid";
    } else {
      session.freeLookupsUsed += 1;
      consumed = "free";
    }

    session.updatedAt = nowIso();
    await writeDb(db);

    return { consumed };
  });
}

export async function grantSingleLookup(
  sessionId: string,
  count = 1,
  email?: string
): Promise<void> {
  await withLock(async () => {
    const db = await readDb();
    const session = upsertSession(db, sessionId);

    session.paidLookupsRemaining = Math.max(session.paidLookupsRemaining + count, 0);
    session.updatedAt = nowIso();

    if (email) {
      session.email = email;
    }

    await writeDb(db);
  });
}

export async function setSubscriptionStatus(
  sessionId: string,
  active: boolean,
  subscriptionEndsAt: string | null,
  email?: string
): Promise<void> {
  await withLock(async () => {
    const db = await readDb();
    const session = upsertSession(db, sessionId);

    session.subscriptionActive = active;
    session.subscriptionEndsAt = subscriptionEndsAt;
    session.updatedAt = nowIso();

    if (email) {
      session.email = email;
    }

    await writeDb(db);
  });
}

export async function hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
  return withLock(async () => {
    const db = await readDb();
    return Boolean(db.processedWebhookEvents[eventId]);
  });
}

export async function markWebhookEventProcessed(eventId: string): Promise<void> {
  await withLock(async () => {
    const db = await readDb();
    db.processedWebhookEvents[eventId] = nowIso();
    await writeDb(db);
  });
}
