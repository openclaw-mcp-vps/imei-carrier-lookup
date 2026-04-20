"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

import { ImeiForm } from "@/components/imei-form";
import { PricingCards } from "@/components/pricing-cards";
import { ResultDisplay } from "@/components/result-display";
import type { ImeiLookupResult } from "@/lib/imei-service";

type LookupApiSuccess = {
  result: ImeiLookupResult;
  consumed: "free" | "paid" | "subscription";
  entitlement: {
    freeLookupsRemaining: number;
    paidLookupsRemaining: number;
    subscriptionActive: boolean;
  };
};

type LookupApiPaywall = {
  error: string;
  message: string;
  entitlement: {
    freeLookupsRemaining: number;
    paidLookupsRemaining: number;
    subscriptionActive: boolean;
  };
};

export function LookupWorkbench(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImeiLookupResult | null>(null);
  const [entitlementNote, setEntitlementNote] = useState<string>(
    "You have 1 free lookup before checkout is required."
  );

  const onLookup = async (imei: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setPaywallMessage(null);

    try {
      const response = await fetch("/api/imei-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imei })
      });

      const payload = (await response.json()) as LookupApiSuccess | LookupApiPaywall;

      if (response.status === 402 && "message" in payload) {
        setResult(null);
        setPaywallMessage(payload.message);
        setEntitlementNote(
          "Free lookup used. Choose pay-per-lookup or unlimited monthly to continue."
        );
        return;
      }

      if (!response.ok || !("result" in payload)) {
        throw new Error(
          "Unable to complete lookup. Check the IMEI and try again in a few seconds."
        );
      }

      setResult(payload.result);
      const nextNote = payload.entitlement.subscriptionActive
        ? "Unlimited monthly access is active on this browser session."
        : `Remaining: ${payload.entitlement.freeLookupsRemaining} free, ${payload.entitlement.paidLookupsRemaining} paid.`;
      setEntitlementNote(nextNote);
    } catch (lookupError) {
      setResult(null);
      setError(
        lookupError instanceof Error ? lookupError.message : "Something went wrong during lookup."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <ImeiForm onLookup={onLookup} isLoading={loading} />

      <div className="section-card flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-muted">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {entitlementNote}
      </div>

      {error ? (
        <div className="section-card flex items-start gap-2 rounded-xl px-4 py-3 text-sm text-orange-300">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          {error}
        </div>
      ) : null}

      {paywallMessage ? (
        <section className="space-y-3 rounded-2xl border border-cyan-800/80 bg-cyan-900/10 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldAlert className="h-5 w-5 text-cyan-300" />
            Unlock More Lookups
          </h2>
          <p className="text-sm text-cyan-100/90">{paywallMessage}</p>
          <PricingCards compact />
        </section>
      ) : null}

      {result ? <ResultDisplay result={result} /> : null}
    </div>
  );
}
