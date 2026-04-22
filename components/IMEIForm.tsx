"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LookupApiResponse, LookupErrorResponse, LookupSuccessResponse } from "@/lib/types";

interface IMEIFormProps {
  onSuccess: (data: LookupSuccessResponse) => void;
  onPaywall: (error: LookupErrorResponse) => void;
}

export function IMEIForm({ onSuccess, onPaywall }: IMEIFormProps) {
  const [imei, setImei] = useState("");
  const [loading, setLoading] = useState(false);

  const normalized = useMemo(() => imei.replace(/\D/g, ""), [imei]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (normalized.length !== 15) {
      toast.error("Enter a 15-digit IMEI.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imei: normalized }),
      });

      const payload = (await response.json()) as LookupApiResponse;

      if (!payload.ok) {
        onPaywall(payload);
        toast.error(payload.error);
        return;
      }

      onSuccess(payload);
      toast.success("Lookup complete.");
    } catch {
      toast.error("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          inputMode="numeric"
          autoComplete="off"
          placeholder="Paste 15-digit IMEI"
          value={imei}
          onChange={(event) => setImei(event.target.value.replace(/[^0-9]/g, ""))}
          aria-label="IMEI"
        />
        <Button type="submit" disabled={loading} className="min-w-36">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Checking" : "Run Lookup"}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-zinc-400">
        Your first lookup is free on this browser. Paid lookups unlock continued checks using cookie-based access.
      </p>
    </form>
  );
}
