import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  title: string;
  price: string;
  period: string;
  summary: string;
  features: string[];
  ctaLabel: string;
  onClick: () => void;
  highlighted?: boolean;
  disabled?: boolean;
};

export default function PricingCard({
  title,
  price,
  period,
  summary,
  features,
  ctaLabel,
  onClick,
  highlighted,
  disabled
}: PricingCardProps) {
  return (
    <Card className={cn("h-full", highlighted && "border-[var(--accent)] shadow-[0_0_0_1px_rgba(88,166,255,0.4)]")}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">
          {price}
          <span className="ml-1 text-sm font-normal text-[var(--muted)]">{period}</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-[var(--good)]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onClick} disabled={disabled}>
          {disabled ? "Enabled" : ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
