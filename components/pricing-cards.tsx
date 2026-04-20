"use client";

import { useState } from "react";
import { Check, Wallet, Zap } from "lucide-react";

type PlanType = "single" | "subscription";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url?: {
        Open?: (url: string) => void;
      };
    };
  }
}

type PricingCardsProps = {
  compact?: boolean;
};

export function PricingCards({ compact = false }: PricingCardsProps): React.JSX.Element {
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openCheckout = async (plan: PlanType): Promise<void> => {
    setError(null);
    setLoadingPlan(plan);

    try {
      const response = await fetch(`/api/checkout?plan=${plan}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout session.");
      }

      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(payload.url);
      } else {
        window.location.href = payload.url;
      }
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout right now."
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="section-card rounded-2xl p-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-emerald-300">
            <Wallet className="h-4 w-4" />
            Pay Per Lookup
          </div>
          <h3 className="text-2xl font-bold">$1</h3>
          <p className="text-sm text-muted">Single report with model, carrier hints, lock status, and risk scoring.</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
              No account required
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
              Use only when you need it
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
              Lemon Squeezy secure checkout
            </li>
          </ul>
          <button
            type="button"
            onClick={() => {
              void openCheckout("single");
            }}
            disabled={loadingPlan !== null}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingPlan === "single" ? "Opening checkout..." : "Buy Single Lookup"}
          </button>
        </article>

        <article className="section-card rounded-2xl border-cyan-700/60 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
            <Zap className="h-4 w-4" />
            Unlimited Monthly
          </div>
          <h3 className="text-2xl font-bold">$15<span className="text-sm text-muted">/month</span></h3>
          <p className="text-sm text-muted">Built for resellers and repair shops that run checks every day.</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
              Unlimited IMEI lookups
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
              Priority policy updates
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
              Cancel anytime
            </li>
          </ul>
          <button
            type="button"
            onClick={() => {
              void openCheckout("subscription");
            }}
            disabled={loadingPlan !== null}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingPlan === "subscription" ? "Opening checkout..." : "Start Unlimited Plan"}
          </button>
        </article>
      </div>

      {error ? <p className="text-sm text-orange-400">{error}</p> : null}
    </section>
  );
}
