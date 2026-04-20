"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import IMEIForm from "@/components/IMEIForm";
import PricingCard from "@/components/PricingCard";
import ResultsDisplay from "@/components/ResultsDisplay";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImeiLookupResult } from "@/lib/imei-service";

type PlanType = "single" | "monthly";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url?: {
        Open: (url: string) => void;
      };
    };
    createLemonSqueezy?: () => void;
  }
}

export default function LookupExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const sessionToken = searchParams.get("session");

  const [result, setResult] = useState<ImeiLookupResult | null>(null);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [paidPlan, setPaidPlan] = useState<PlanType | null>(null);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const grantAccess = useCallback(async (token: string) => {
    setIsGrantingAccess(true);
    try {
      const response = await fetch("/api/access/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token })
      });

      const data = (await response.json()) as { granted?: boolean; plan?: PlanType; error?: string };

      if (!response.ok || !data.granted || !data.plan) {
        throw new Error(data.error || "Payment detected, but access is not ready yet.");
      }

      setPaidPlan(data.plan);
      setPaywallMessage(null);
      toast.success("Payment confirmed. Full lookup access enabled.");
      router.replace("/", { scroll: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to grant access.";
      toast.error(message);
    } finally {
      setIsGrantingAccess(false);
    }
  }, [router]);

  useEffect(() => {
    if (checkoutStatus === "success" && sessionToken && !isGrantingAccess) {
      void grantAccess(sessionToken);
    }

    if (checkoutStatus === "canceled") {
      toast.error("Checkout canceled. You can retry anytime.");
      router.replace("/", { scroll: false });
    }
  }, [checkoutStatus, grantAccess, isGrantingAccess, router, sessionToken]);

  const paywallVisible = useMemo(() => Boolean(paywallMessage), [paywallMessage]);

  async function startCheckout(plan: PlanType) {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });

      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Unable to create checkout session.");
      }

      if (typeof window !== "undefined") {
        window.createLemonSqueezy?.();
        if (window.LemonSqueezy?.Url?.Open) {
          window.LemonSqueezy.Url.Open(data.checkoutUrl);
        } else {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed.";
      toast.error(message);
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <>
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xl">IMEI Lookup Tool</span>
            {paidPlan ? (
              <Badge variant="success">Paid Access: {paidPlan === "monthly" ? "Unlimited" : "Single"}</Badge>
            ) : (
              <Badge variant="outline">1 free lookup available per browser</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IMEIForm
            onResult={(nextResult) => {
              setResult(nextResult);
              setPaywallMessage(null);
            }}
            onPaywallRequired={setPaywallMessage}
          />

          {result ? <ResultsDisplay result={result} /> : null}

          {paywallVisible ? (
            <div className="mt-6 rounded-lg border border-[color:rgba(248,81,73,0.35)] bg-[color:rgba(248,81,73,0.08)] p-4">
              <p className="text-sm font-medium">{paywallMessage}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Choose a plan below to continue running lookups instantly.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <PricingCard
          title="Pay-As-You-Go"
          price="$1"
          period="/lookup"
          summary="Best for occasional checks before individual purchases."
          features={[
            "Unlocks immediate post-free lookup access",
            "Same result depth as monthly plan",
            "No subscription commitment"
          ]}
          ctaLabel="Buy Lookup"
          onClick={() => startCheckout("single")}
          disabled={isCheckingOut || isGrantingAccess}
        />
        <PricingCard
          title="Unlimited"
          price="$15"
          period="/month"
          summary="Built for used-phone desks, flippers, and high-volume buyers."
          features={[
            "Unlimited lookups every month",
            "Fast workflow for batch buying decisions",
            "Best value after 15+ checks"
          ]}
          ctaLabel="Start Unlimited"
          onClick={() => startCheckout("monthly")}
          highlighted
          disabled={isCheckingOut || isGrantingAccess}
        />
      </div>
    </>
  );
}
