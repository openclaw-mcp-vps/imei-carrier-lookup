import Link from "next/link";
import {
  ArrowRight,
  BadgeAlert,
  BadgeCheck,
  CircleDollarSign,
  KeyRound,
  Smartphone
} from "lucide-react";

import { PricingCards } from "@/components/pricing-cards";

const faqItems = [
  {
    question: "Can I use this without creating an account?",
    answer:
      "Yes. You get one free lookup immediately. If you need more, checkout happens in a Lemon Squeezy overlay and access is unlocked on this browser session."
  },
  {
    question: "How accurate is the carrier field?",
    answer:
      "Carrier is an attribution estimate based on TAC and model metadata. Confidence is shown with every result so you can decide when to request extra proof from a seller."
  },
  {
    question: "Does this check blacklist status directly?",
    answer:
      "No single free source can guarantee global blacklist coverage. We compute a practical risk score and provide actionable next steps for verification before purchase."
  },
  {
    question: "Who is this built for?",
    answer:
      "Used phone resellers, marketplace buyers, and anyone moving a device between carriers who wants a fast pre-purchase sanity check."
  }
];

export default function HomePage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="section-card relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="absolute -right-10 -top-12 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-14 bottom-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative space-y-5">
          <p className="inline-flex rounded-full border border-emerald-700/70 bg-emerald-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            IMEI Carrier Lookup
          </p>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
            IMEI Carrier Lookup: paste IMEI, get carrier + unlock policy + scam risk.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted sm:text-base">
            Existing IMEI sites push ads, force signup, and charge $5 to $15 for basic checks.
            This tool is faster: model detection, lock guidance, and fraud risk scoring in one clean report.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lookup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Start Free Lookup
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-600"
            >
              See Pricing
            </a>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="section-card rounded-2xl p-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-orange-300">
            <BadgeAlert className="h-4 w-4" />
            Problem
          </div>
          <p className="text-sm text-muted">
            Buyers get burned by locked devices, unpaid installment balances, and cloned IMEIs that look fine at first glance.
          </p>
        </article>
        <article className="section-card rounded-2xl p-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
            <Smartphone className="h-4 w-4" />
            Solution
          </div>
          <p className="text-sm text-muted">
            We map IMEI TAC data to model metadata, estimate carrier lock context, and convert messy checks into a clear pass/fail risk profile.
          </p>
        </article>
        <article className="section-card rounded-2xl p-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-emerald-300">
            <CircleDollarSign className="h-4 w-4" />
            Why It Wins
          </div>
          <p className="text-sm text-muted">
            One free lookup, then pay as you go at $1 or run unlimited at $15/month. No bloated dashboard, no forced account flow.
          </p>
        </article>
      </section>

      <section className="mt-10 space-y-5">
        <h2 className="text-2xl font-bold sm:text-3xl">What each report includes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="section-card rounded-xl p-4">
            <BadgeCheck className="mb-2 h-5 w-5 text-emerald-300" />
            <h3 className="text-sm font-semibold">Device model match</h3>
            <p className="mt-1 text-sm text-muted">TAC-based model and manufacturer lookup with source labeling.</p>
          </article>
          <article className="section-card rounded-xl p-4">
            <KeyRound className="mb-2 h-5 w-5 text-cyan-300" />
            <h3 className="text-sm font-semibold">Carrier + SIM lock insight</h3>
            <p className="mt-1 text-sm text-muted">Likely carrier assignment and lock context confidence score.</p>
          </article>
          <article className="section-card rounded-xl p-4">
            <CircleDollarSign className="mb-2 h-5 w-5 text-emerald-300" />
            <h3 className="text-sm font-semibold">Unlock policy summary</h3>
            <p className="mt-1 text-sm text-muted">Practical eligibility requirements linked to official carrier policy pages.</p>
          </article>
          <article className="section-card rounded-xl p-4">
            <BadgeAlert className="mb-2 h-5 w-5 text-orange-300" />
            <h3 className="text-sm font-semibold">Fraud risk score</h3>
            <p className="mt-1 text-sm text-muted">Actionable risk score with reasons and a verification checklist before buying.</p>
          </article>
        </div>
      </section>

      <section id="pricing" className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold sm:text-3xl">Pricing</h2>
        <p className="text-sm text-muted sm:text-base">
          Choose what matches your workflow: occasional buyer or high-volume reseller.
        </p>
        <PricingCards />
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold sm:text-3xl">FAQ</h2>
        <div className="space-y-3">
          {faqItems.map((item) => (
            <details key={item.question} className="section-card rounded-xl p-4">
              <summary className="cursor-pointer text-sm font-semibold sm:text-base">
                {item.question}
              </summary>
              <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
