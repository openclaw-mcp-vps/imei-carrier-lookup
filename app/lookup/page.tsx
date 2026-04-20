import type { Metadata } from "next";

import { LookupWorkbench } from "@/components/lookup-workbench";

export const metadata: Metadata = {
  title: "Lookup IMEI",
  description:
    "Run an IMEI lookup to identify device model, likely carrier, SIM lock status, unlock policy guidance, and fraud risk score."
};

export default function LookupPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 space-y-3">
        <p className="inline-flex rounded-full border border-emerald-700/70 bg-emerald-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          IMEI Carrier Lookup Tool
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Paste IMEI. Get carrier confidence, unlock policy, and scam risk in seconds.
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted sm:text-base">
          Optimized for phone resellers and used-device buyers who need fast risk checks before payment.
        </p>
      </header>

      <LookupWorkbench />
    </main>
  );
}
