import { AlertTriangle, Lock, RadioTower, Smartphone, Sparkles } from "lucide-react";

import type { ImeiLookupResult } from "@/lib/imei-service";

function riskClass(level: ImeiLookupResult["fraudRisk"]["level"]): string {
  if (level === "high") {
    return "risk-high";
  }

  if (level === "medium") {
    return "risk-medium";
  }

  return "risk-low";
}

type ResultDisplayProps = {
  result: ImeiLookupResult;
};

export function ResultDisplay({ result }: ResultDisplayProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="section-card rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
            <Smartphone className="h-4 w-4" />
            Device
          </div>
          <p className="text-base font-semibold">{result.device.model}</p>
          <p className="mt-1 text-sm text-muted">{result.device.manufacturer}</p>
          <p className="mt-3 text-xs text-muted">
            Data source: {result.source}
          </p>
        </article>

        <article className="section-card rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
            <RadioTower className="h-4 w-4" />
            Carrier
          </div>
          <p className="text-base font-semibold">{result.carrier.name}</p>
          <p className="mt-1 text-sm text-muted">
            Confidence: {result.carrier.confidence}
          </p>
        </article>

        <article className="section-card rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
            <Lock className="h-4 w-4" />
            SIM Lock
          </div>
          <p className="text-base font-semibold">{result.simLockStatus}</p>
        </article>

        <article className="section-card rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
            <AlertTriangle className="h-4 w-4" />
            Fraud Risk
          </div>
          <p className={`text-2xl font-bold ${riskClass(result.fraudRisk.level)}`}>
            {result.fraudRisk.score}
          </p>
          <p className={`mt-1 text-sm capitalize ${riskClass(result.fraudRisk.level)}`}>
            {result.fraudRisk.level} risk
          </p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="section-card rounded-xl p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Unlock Policy Snapshot
          </h3>
          <p className="mb-3 text-sm leading-6">{result.unlockPolicy.summary}</p>
          <ul className="space-y-2 text-sm text-muted">
            {result.unlockPolicy.requirements.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            className="mt-4 inline-block text-sm text-cyan-300 hover:text-cyan-200"
            href={result.unlockPolicy.source}
            target="_blank"
            rel="noreferrer"
          >
            Official carrier policy reference
          </a>
        </article>

        <article className="section-card rounded-xl p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Risk Drivers and Next Steps
          </h3>
          <ul className="space-y-2 text-sm text-muted">
            {result.fraudRisk.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>

          <div className="my-4 h-px w-full bg-[var(--border)]" />

          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Action Plan
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            {result.recommendations.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
