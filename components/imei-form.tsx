"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  imei: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^\d{15}$/.test(value), {
      message: "IMEI must contain exactly 15 digits."
    })
    .refine((value) => {
      let sum = 0;
      let shouldDouble = false;

      for (let i = value.length - 1; i >= 0; i -= 1) {
        let digit = Number(value[i]);
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }

      return sum % 10 === 0;
    }, {
      message: "IMEI check digit failed. Verify the number and try again."
    })
});

type FormValues = z.infer<typeof formSchema>;

type ImeiFormProps = {
  onLookup: (imei: string) => Promise<void> | void;
  isLoading: boolean;
};

export function ImeiForm({ onLookup, isLoading }: ImeiFormProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imei: ""
    }
  });

  const submit = (values: FormValues): void => {
    void onLookup(values.imei);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="section-card rounded-2xl p-4 sm:p-6"
      aria-label="IMEI lookup form"
    >
      <label htmlFor="imei" className="mb-2 block text-sm font-medium text-muted">
        Enter IMEI (15 digits)
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            id="imei"
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Example: 356938035643809"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3 pr-11 text-base outline-none ring-0 transition focus:border-emerald-400"
            {...register("imei")}
            disabled={isLoading}
          />
          <ShieldCheck className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Search className="h-4 w-4" />
          {isLoading ? "Running lookup..." : "Lookup IMEI"}
        </button>
      </div>

      {errors.imei ? (
        <p className="mt-3 text-sm text-orange-400">{errors.imei.message}</p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          One free lookup is included. After that, choose pay-per-lookup or unlimited access.
        </p>
      )}
    </form>
  );
}
