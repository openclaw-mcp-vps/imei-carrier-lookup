import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const siteName = "IMEI Carrier Lookup";
const description =
  "Paste an IMEI and get model, carrier, lock status, unlock policy, and a practical scam-risk score in seconds.";

export const metadata: Metadata = {
  metadataBase: new URL("https://imei-carrier-lookup.app"),
  title: {
    default: `${siteName} | Fast Carrier + Unlock + Fraud Check`,
    template: `%s | ${siteName}`
  },
  description,
  applicationName: siteName,
  keywords: [
    "IMEI checker",
    "carrier lookup",
    "SIM lock status",
    "unlock policy",
    "phone fraud check",
    "used phone buyer tools"
  ],
  openGraph: {
    title: "IMEI Carrier Lookup — Carrier, Unlock Rules, Scam Risk",
    description,
    url: "https://imei-carrier-lookup.app",
    siteName,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "IMEI Carrier Lookup",
    description
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
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#161b22",
              color: "#e6edf3",
              border: "1px solid #30363d"
            }
          }}
        />
      </body>
    </html>
  );
}
