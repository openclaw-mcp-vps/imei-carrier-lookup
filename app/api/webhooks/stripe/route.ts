import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  extendSubscriptionFromInvoice,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  recordCheckoutPurchase,
  revokeSubscription,
} from "@/lib/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

function extractObjectId(value: string | Stripe.Subscription | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id ?? null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook signature verification failed.",
      },
      { status: 400 },
    );
  }

  if (await isWebhookEventProcessed(event.id)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.customer_email;

    if (email) {
      await recordCheckoutPurchase({
        email,
        mode: session.mode === "subscription" ? "subscription" : "payment",
        amountTotalInCents: session.amount_total,
        stripeCustomerId: extractObjectId(session.customer),
        stripeSubscriptionId: extractObjectId(session.subscription),
        stripeSessionId: session.id,
      });
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const invoiceWithOptionalSubscription = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    };

    await extendSubscriptionFromInvoice({
      email: invoice.customer_email,
      stripeCustomerId: extractObjectId(invoice.customer),
      stripeSubscriptionId: extractObjectId(invoiceWithOptionalSubscription.subscription ?? null),
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await revokeSubscription({
      stripeCustomerId: extractObjectId(subscription.customer),
      stripeSubscriptionId: subscription.id,
    });
  }

  await markWebhookEventProcessed(event.id);

  return NextResponse.json({ ok: true });
}
