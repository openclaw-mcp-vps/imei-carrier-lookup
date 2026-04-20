import { Suspense } from "react";
import { Shield, Smartphone, UnlockKeyhole, Zap } from "lucide-react";
import LookupExperience from "@/components/LookupExperience";

const faqItems = [
  {
    q: "How accurate is carrier and lock detection?",
    a: "When a live provider is configured, results are sourced from real IMEI intelligence endpoints and carrier policy mappings. Without a live provider, model/TAC analysis still runs and confidence is shown transparently."
  },
  {
    q: "Do I need an account for one lookup?",
    a: "No account is required for your first lookup. After that, you can unlock more checks with a one-time purchase or the unlimited monthly plan."
  },
  {
    q: "Can I use this before buying a used phone?",
    a: "Yes. This is built for pre-purchase checks so you can spot suspicious devices, lock issues, and carrier constraints before money changes hands."
  },
  {
    q: "What does the risk score mean?",
    a: "The fraud score combines IMEI validity checks, TAC confidence, lock inconsistencies, and known warning signals. It is a decision aid, not a legal determination."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-20 pt-10 sm:px-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[color:rgba(22,27,34,0.78)] p-6 shadow-2xl shadow-black/30 sm:p-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
          <Shield className="h-3.5 w-3.5 text-[var(--accent)]" />
          IMEI Carrier Lookup for used-phone buyers and resellers
        </p>
        <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          IMEI Carrier Lookup
          <span className="mt-2 block text-[var(--accent)]">
            Paste IMEI, get carrier, unlock policy, and scam risk
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          Most IMEI tools are ad-heavy, expensive, and force signup before showing anything useful. This
          checker keeps the flow clean: instant model and lock analysis, carrier unlock policy context, and
          a clear risk score you can act on.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[color:rgba(13,17,23,0.8)] p-4">
            <p className="font-medium text-[var(--foreground)]">$1 per lookup</p>
            <p className="mt-1">Pay as you go for occasional checks.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[color:rgba(13,17,23,0.8)] p-4">
            <p className="font-medium text-[var(--foreground)]">$15/month unlimited</p>
            <p className="mt-1">Designed for shops and power resellers.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[color:rgba(13,17,23,0.8)] p-4">
            <p className="font-medium text-[var(--foreground)]">No signup for first lookup</p>
            <p className="mt-1">Try it instantly, then pay only if it helps.</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <Suspense
          fallback={
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
              Loading lookup tool...
            </div>
          }
        >
          <LookupExperience />
        </Suspense>
      </section>

      <section className="mt-16 grid gap-5 sm:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <Smartphone className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="mt-3 text-lg font-semibold">Problem</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Buyers lose money on blacklisted, carrier-locked, or suspicious devices because standard checks are
            slow, opaque, or overpriced.
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <UnlockKeyhole className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="mt-3 text-lg font-semibold">Solution</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            One input returns the device identity, lock context, carrier unlock policy, and confidence-aware risk
            score in a format that is easy to evaluate fast.
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <Zap className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="mt-3 text-lg font-semibold">Why It Converts</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            No forced registration, clear pricing, immediate value, and a mobile-first interface you can use at
            the point of purchase.
          </p>
        </article>
      </section>

      <section id="faq" className="mt-16 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-5 divide-y divide-[var(--border)]">
          {faqItems.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="cursor-pointer list-none text-sm font-medium sm:text-base">
                <span className="group-open:text-[var(--accent)]">{item.q}</span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
