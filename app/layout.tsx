import type { Metadata } from "next";
import { Space_Grotesk, Geist } from "next/font/google";

import "@/app/globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://imeicarrierlookup.com"),
  title: "IMEI Carrier Lookup | Carrier, SIM Lock, Unlock Policy, Scam Risk",
  description:
    "Paste an IMEI and instantly get model identity, probable carrier, SIM lock status, official unlock policy, and fraud risk score. One free lookup, then pay as you go.",
  applicationName: "IMEI Carrier Lookup",
  keywords: [
    "IMEI checker",
    "carrier lookup",
    "SIM lock check",
    "unlock policy",
    "used phone fraud check",
    "phone reseller tool",
  ],
  openGraph: {
    type: "website",
    url: "https://imeicarrierlookup.com",
    title: "IMEI Carrier Lookup - Carrier + Unlock Policy + Scam Risk",
    description:
      "A fast IMEI tool for resellers and buyers: model verification, carrier hinting, SIM lock posture, and fraud scoring.",
    siteName: "IMEI Carrier Lookup",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "IMEI Carrier Lookup",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IMEI Carrier Lookup",
    description: "Run one free IMEI check. Get carrier, unlock policy, and fraud risk in seconds.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
