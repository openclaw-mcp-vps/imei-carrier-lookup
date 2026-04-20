import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImeiLookupResult } from "@/lib/imei-service";

type ResultsDisplayProps = {
  result: ImeiLookupResult;
};

function riskVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 65) {
    return "danger";
  }
  if (score >= 35) {
    return "warning";
  }
  return "success";
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span>Lookup Results</span>
          <Badge variant={riskVariant(result.fraudRiskScore)}>
            Fraud Risk {result.fraudRiskScore}/100 ({result.fraudRiskLevel})
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">IMEI</p>
            <p className="mt-1 font-medium">{result.imei}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">TAC</p>
            <p className="mt-1 font-medium">{result.tac}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Device</p>
            <p className="mt-1 font-medium">
              {result.manufacturer} {result.model}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Type</p>
            <p className="mt-1 font-medium">{result.deviceType}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Carrier</p>
            <p className="mt-1 font-medium">{result.carrier}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">SIM Lock</p>
            <p className="mt-1 flex items-center gap-2 font-medium">
              {result.simLockStatus === "Unlocked" ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--good)]" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-[var(--warn)]" />
              )}
              {result.simLockStatus}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] p-3 text-sm">
          <p className="font-medium">Unlock Policy</p>
          <p className="mt-2 leading-6 text-[var(--muted)]">{result.unlockPolicy}</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] p-3 text-sm">
          <p className="font-medium">Fraud Signals</p>
          <ul className="mt-2 space-y-1 text-[var(--muted)]">
            {result.fraudSignals.length > 0 ? (
              result.fraudSignals.map((signal) => (
                <li key={signal} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" />
                  <span>{signal}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--good)]" />
                <span>No immediate risk signals detected.</span>
              </li>
            )}
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Data source: {result.source === "live" ? "Live provider + local policy map" : "Local TAC + policy map"}
            . Confidence: {result.confidence}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
