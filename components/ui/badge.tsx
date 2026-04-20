import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--accent-soft)] text-white",
        outline: "border-[var(--border)] text-[var(--foreground)]",
        success: "border-[color:rgba(63,185,80,0.35)] bg-[color:rgba(63,185,80,0.18)] text-[#9be9a8]",
        warning: "border-[color:rgba(210,153,34,0.35)] bg-[color:rgba(210,153,34,0.18)] text-[#f2cc60]",
        danger: "border-[color:rgba(248,81,73,0.35)] bg-[color:rgba(248,81,73,0.18)] text-[#ffaba8]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
