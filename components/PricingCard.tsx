import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PricingCardProps {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  featured?: boolean;
}

export function PricingCard({ name, price, cadence, description, features, featured }: PricingCardProps) {
  return (
    <Card className={featured ? "border-cyan-500/60 ring-1 ring-cyan-500/30" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {featured ? <Badge variant="success">Most Popular</Badge> : null}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
          <span className="pb-1 text-sm text-zinc-400">{cadence}</span>
        </div>
        <p className="text-sm text-zinc-400">{description}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-zinc-300">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy with Stripe
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
