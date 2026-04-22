import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1 text-base text-zinc-100 shadow-sm transition-all outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-100 placeholder:text-zinc-500 focus-visible:border-cyan-500/70 focus-visible:ring-2 focus-visible:ring-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
