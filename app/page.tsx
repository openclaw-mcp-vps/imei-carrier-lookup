import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LookupWorkspace } from "@/components/LookupWorkspace";
import { PricingCard } from "@/components/PricingCard";

const faq = [
  {
    question: "How is this different from generic IMEI websites?",
    answer:
      "Most sites stop at model name. This tool combines model identity, carrier context, SIM lock posture, unlock-policy guidance, and a fraud score designed for used-phone transactions.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No account is needed for your first lookup. After that, checkout runs on Stripe hosted checkout and access is stored on your browser via secure cookies.",
  },
  {
    question: "Can an IMEI always reveal exact current carrier?",
    answer:
      "Not always. IMEI data is strongest for device identity and original profile hints. When carrier certainty is low, the report explicitly says so and provides conservative unlock guidance.",
  },
  {
    question: "How does paid access work after checkout?",
    answer:
      "Use the same email you paid with in the unlock box. The app verifies your purchase and enables paid access on the current browser with a signed cookie.",
  },
];

const problems = [
  "Used-phone buyers lose money when an IMEI is blacklisted or locked to an unexpected carrier.",
  "Existing lookup tools hide core facts behind ad clutter or force account creation before first use.",
  "Most checkers charge per click without helping buyers decide if a listing is risky.",
];

const solutionPoints = [
  "One-screen report with model, carrier hint, lock posture, and fraud score.",
  "Official unlock-policy links for major US carriers, plus confidence scoring when carrier certainty is low.",
  "No login friction: first lookup free, then pay-as-you-go or unlimited plan via Stripe checkout.",
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container mx-auto px-4 pb-16 pt-14 md:pb-24 md:pt-20">
          <Badge variant="default" className="mb-6">
            IMEI Carrier Lookup for resellers and used-phone buyers
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-zinc-100 md:text-6xl">
            IMEI Carrier Lookup: paste IMEI, get carrier, unlock policy, and scam risk in seconds.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Skip ad-heavy checker sites and manual research. This tool gives you a transaction-ready report that helps
            you price devices correctly, reject risky listings early, and avoid locked-phone surprises.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-300">
            <span className="chip">First lookup free</span>
            <span className="chip">No signup required</span>
            <span className="chip">Stripe-hosted checkout</span>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-4 px-4 py-14 md:grid-cols-3">
        {problems.map((problem) => (
          <Card key={problem}>
            <CardHeader>
              <CardTitle className="text-base">Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-zinc-300">{problem}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container mx-auto px-4 pb-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How This Tool Solves It</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {solutionPoints.map((point) => (
                <div key={point} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-200">
                  {point}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="lookup-tool" className="container mx-auto px-4 py-10">
        <LookupWorkspace />
      </section>

      <section id="pricing" className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Simple pricing for lookup-heavy workflows</h2>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Use the same Stripe checkout link for fast deployment. Configure your Stripe Payment Link to point at the
            plan you want to sell first, then add additional links later.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PricingCard
            name="Pay Per Lookup"
            price="$1"
            cadence="per lookup"
            description="Great for occasional buyers validating one device at a time."
            features={[
              "Single IMEI report with fraud scoring",
              "Carrier + unlock policy guidance",
              "No account creation required",
              "Unlock access on this browser after payment",
            ]}
          />

          <PricingCard
            name="Unlimited Monthly"
            price="$15"
            cadence="per month"
            description="Built for resellers processing many trade-ins and marketplace devices."
            features={[
              "Unlimited IMEI checks while active",
              "Fast browser-based access after verification",
              "Same report quality as pay-per-lookup",
              "Best value for recurring inventory intake",
            ]}
            featured
          />
        </div>
      </section>

      <section id="faq" className="container mx-auto px-4 pb-20 pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faq.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
