import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://imei-carrier-lookup.app"),
  title: {
    default: "IMEI Carrier Lookup | Carrier, Unlock Policy, and Scam Risk",
    template: "%s | IMEI Carrier Lookup"
  },
  description:
    "Paste an IMEI and instantly get model identification, likely carrier, SIM lock status, unlock policy guidance, and a practical fraud risk score.",
  keywords: [
    "IMEI check",
    "carrier lookup",
    "SIM lock status",
    "phone unlock policy",
    "used phone fraud check"
  ],
  openGraph: {
    title: "IMEI Carrier Lookup",
    description:
      "Fast IMEI intelligence for used phone buyers and resellers. Model, carrier hints, unlock policy, and risk score in one report.",
    url: "https://imei-carrier-lookup.app",
    siteName: "IMEI Carrier Lookup",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "IMEI Carrier Lookup",
    description:
      "Paste an IMEI and get carrier, unlock policy, and scam risk in seconds."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} antialiased`}
        style={{
          fontFamily: "var(--font-space-grotesk), ui-sans-serif, sans-serif"
        }}
      >
        <Script
          src="https://assets.lemonsqueezy.com/lemon.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
