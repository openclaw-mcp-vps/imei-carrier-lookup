"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImeiLookupResult } from "@/lib/imei-service";

type ImeiFormProps = {
  onResult: (result: ImeiLookupResult) => void;
  onPaywallRequired: (message: string) => void;
};

export default function IMEIForm({ onResult, onPaywallRequired }: ImeiFormProps) {
  const [imei, setImei] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imei })
      });

      const data = (await response.json()) as {
        error?: string;
        needsPayment?: boolean;
        result?: ImeiLookupResult;
      };

      if (!response.ok) {
        if (data.needsPayment) {
          onPaywallRequired(data.error || "Payment required.");
          toast.error("Free lookup already used. Unlock more checks to continue.");
          return;
        }

        throw new Error(data.error || "Lookup failed.");
      }

      if (!data.result) {
        throw new Error("Lookup returned no result.");
      }

      onResult(data.result);
      toast.success("IMEI analyzed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="imei" className="text-sm font-medium">
        Enter 15-digit IMEI
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="imei"
          name="imei"
          inputMode="numeric"
          pattern="[0-9]{15}"
          maxLength={15}
          required
          value={imei}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 15);
            setImei(digits);
          }}
          placeholder="Example: 356938035643809"
          className="sm:flex-1"
        />
        <Button type="submit" className="sm:w-44" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Run Lookup"
          )}
        </Button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        First lookup is free. After that: $1 per lookup or $15/month unlimited.
      </p>
    </form>
  );
}
