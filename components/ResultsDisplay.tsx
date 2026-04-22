import { AlertTriangle, Lock, ShieldCheck, Smartphone, Wifi } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImeiLookupResult } from "@/lib/types";

interface ResultsDisplayProps {
  result: ImeiLookupResult;
}

function riskVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 65) {
    return "destructive";
  }

  if (score >= 35) {
    return "warning";
  }

  return "success";
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-cyan-300" /> Device Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Brand</span>
            <span className="font-medium">{result.device.brand}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Model</span>
            <span className="font-medium">{result.device.model}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">TAC</span>
            <span className="font-mono">{result.tac}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">IMEI Validity</span>
            <Badge variant={result.isValidImei ? "success" : "destructive"}>
              {result.isValidImei ? "Checksum Valid" : "Checksum Failed"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Data Source</span>
            <Badge variant="secondary">{result.device.source}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="h-5 w-5 text-cyan-300" /> Carrier + Lock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Carrier</span>
            <span className="font-medium">{result.carrier.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Confidence</span>
            <Badge variant="secondary">{result.carrier.confidence}</Badge>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">SIM Lock</span>
            <Badge variant={result.carrier.simLockStatus === "locked" ? "warning" : "success"}>
              {result.carrier.simLockStatus}
            </Badge>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-zinc-300">
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
              <Lock className="h-4 w-4" /> Unlock policy
            </div>
            <p className="text-sm">{result.unlockPolicy.summary}</p>
            <a
              className="mt-2 inline-block text-xs text-cyan-300 hover:text-cyan-200"
              href={result.unlockPolicy.policyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Official policy reference
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-cyan-300" /> Fraud Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={riskVariant(result.fraud.score)}>
              {result.fraud.level.toUpperCase()} RISK {result.fraud.score}/100
            </Badge>
            <span className="text-sm text-zinc-400">
              Higher score means stronger signs of listing or ownership risk.
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400"
              style={{ width: `${Math.max(3, result.fraud.score)}%` }}
            />
          </div>

          <div className="grid gap-2 text-sm text-zinc-300 md:grid-cols-2">
            {result.fraud.signals.map((signal) => (
              <div key={signal} className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>{signal}</span>
              </div>
            ))}
          </div>

          {result.notes.length > 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-400">
              <p className="mb-2 font-medium text-zinc-200">Lookup notes</p>
              <ul className="space-y-2">
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
