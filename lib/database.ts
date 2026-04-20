import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type CheckoutPlan = "single" | "monthly";

export type CheckoutSession = {
  token: string;
  plan: CheckoutPlan;
  status: "pending" | "paid";
  createdAt: string;
  paidAt?: string;
  orderId?: string;
  buyerEmail?: string;
};

type DbShape = {
  sessions: CheckoutSession[];
};

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "checkout-sessions.json");

async function ensureDb() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    const emptyDb: DbShape = { sessions: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2), "utf8");
  }
}

async function readDb(): Promise<DbShape> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as DbShape;
}

async function writeDb(db: DbShape) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function createCheckoutSession(plan: CheckoutPlan) {
  const token = randomUUID();
  const session: CheckoutSession = {
    token,
    plan,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  const db = await readDb();
  db.sessions.unshift(session);
  await writeDb(db);

  return session;
}

export async function markCheckoutSessionPaid(input: {
  token: string;
  orderId?: string;
  buyerEmail?: string;
}) {
  const db = await readDb();
  const session = db.sessions.find((item) => item.token === input.token);

  if (!session) {
    return null;
  }

  session.status = "paid";
  session.paidAt = new Date().toISOString();
  session.orderId = input.orderId;
  session.buyerEmail = input.buyerEmail;

  await writeDb(db);
  return session;
}

export async function getCheckoutSession(token: string) {
  const db = await readDb();
  return db.sessions.find((session) => session.token === token) ?? null;
}
