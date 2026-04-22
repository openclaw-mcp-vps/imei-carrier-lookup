"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { CreditCard, ShieldCheck, Unlock } from "lucide-react";

import { IMEIForm } from "@/components/IMEIForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LookupErrorResponse, LookupSuccessResponse } from "@/lib/types";

interface StatusPayload {
  hasAccess: boolean;
  tier: "single" | "unlimited" | null;
  remainingLookups: number | null;
  expiresAt: string | null;
  freeLookupUsed: boolean;
  verifiedEmail: string | null;
}

const initialStatus: StatusPayload = {
  hasAccess: false,
  tier: null,
  remainingLookups: 0,
  expiresAt: null,
  freeLookupUsed: false,
  verifiedEmail: null,
};

export function LookupWorkspace() {
  const [status, setStatus] = useState<StatusPayload>(initialStatus);
  const [result, setResult] = useState<LookupSuccessResponse | null>(null);
  const [paywallError, setPaywallError] = useState<LookupErrorResponse | null>(null);
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function refreshStatus() {
    try {
      const response = await fetch("/api/paywall/status", { cache: "no-store" });
      const payload = (await response.json()) as StatusPayload;
      setStatus(payload);
    } catch {
      // Silent status refresh failure.
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function handleVerifyPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Enter the email used at checkout.");
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch("/api/paywall/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!payload.ok) {
        toast.error(payload.error || "Verification failed.");
        return;
      }

      toast.success("Paid access unlocked on this browser.");
      await refreshStatus();
      setPaywallError(null);
    } catch {
      toast.error("Could not verify purchase right now.");
    } finally {
      setVerifying(false);
    }
  }

  const statusBadge = useMemo(() => {
    if (status.hasAccess && status.tier === "unlimited") {
      return <Badge variant="success">Unlimited Active</Badge>;
    }

    if (status.hasAccess && status.tier === "single") {
      return <Badge variant="warning">Paid Credits: {status.remainingLookups ?? 0}</Badge>;
    }

    if (!status.freeLookupUsed) {
      return <Badge variant="default">1 Free Lookup Available</Badge>;
    }

    return <Badge variant="secondary">Free Lookup Used</Badge>;
  }, [status]);

  return (
    <div className="space-y-6">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#e5e7eb",
            border: "1px solid #1f2937",
          },
        }}
      />

      <Card className="border-cyan-500/30">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Live Tool</Badge>
            {statusBadge}
          </div>
          <CardTitle className="text-2xl">IMEI Carrier + Unlock + Fraud Check</CardTitle>
          <p className="text-sm text-zinc-400">
            Paste an IMEI to inspect model identity, estimated carrier profile, SIM lock posture, and resale fraud risk.
          </p>
        </CardHeader>
        <CardContent>
          <IMEIForm
            onSuccess={(payload) => {
              setResult(payload);
              setPaywallError(null);
              void refreshStatus();
            }}
            onPaywall={(errorPayload) => {
              setPaywallError(errorPayload);
              void refreshStatus();
            }}
          />
        </CardContent>
      </Card>

      {paywallError?.paywall?.required ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-cyan-300" /> Unlock More Lookups
            </CardTitle>
            <p className="text-sm text-zinc-400">{paywallError.paywall.message}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer">
                Buy with Stripe
              </a>
            </Button>

            <form className="space-y-3" onSubmit={handleVerifyPurchase}>
              <label className="text-sm text-zinc-300" htmlFor="purchase-email">
                Already paid? Verify with checkout email.
              </label>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  id="purchase-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Button type="submit" variant="secondary" disabled={verifying}>
                  <Unlock className="h-4 w-4" />
                  {verifying ? "Verifying" : "Unlock Access"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
            <h3 className="text-xl font-semibold">Lookup Result</h3>
          </div>
          <ResultsDisplay result={result.data} />
        </>
      ) : null}
    </div>
  );
}
