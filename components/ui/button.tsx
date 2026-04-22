import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-500 text-black hover:bg-cyan-400 active:bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.25)]",
        secondary:
          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700",
        ghost: "text-zinc-100 hover:bg-zinc-800",
        outline: "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
