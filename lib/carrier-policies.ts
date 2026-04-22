import { UnlockPolicy } from "@/lib/types";

const POLICIES: UnlockPolicy[] = [
  {
    carrier: "Verizon",
    summary: "Verizon phones are usually unlocked automatically 60 days after activation.",
    eligibilityRules: [
      "Device must be active on Verizon for at least 60 days after purchase.",
      "Device cannot be reported lost, stolen, or linked to fraud.",
      "Business and military deployment lines can have separate policies.",
    ],
    typicalTimeline: "60 days from activation",
    policyUrl: "https://www.verizon.com/about/consumer-safety/device-unlocking-policy",
  },
  {
    carrier: "AT&T",
    summary: "AT&T unlocks eligible devices through an online request portal.",
    eligibilityRules: [
      "Postpaid devices generally need 60 days of active service.",
      "Installment plans must be fully paid.",
      "The IMEI must be clean and not flagged for fraud or theft.",
    ],
    typicalTimeline: "2-5 business days after request",
    policyUrl: "https://www.att.com/deviceunlock/",
  },
  {
    carrier: "T-Mobile",
    summary: "T-Mobile supports unlock requests through app or support after usage requirements are met.",
    eligibilityRules: [
      "Device must usually be active on account for 40+ days.",
      "Account must be in good standing.",
      "Device balance must be paid in full.",
    ],
    typicalTimeline: "Immediate to 2 business days",
    policyUrl: "https://www.t-mobile.com/responsibility/consumer-info/policies/sim-unlock-policy",
  },
  {
    carrier: "Metro by T-Mobile",
    summary: "Metro devices are generally eligible after 180 consecutive days of active service.",
    eligibilityRules: [
      "180 days of active service on the Metro network.",
      "Device must not be blocked for non-payment or fraud.",
      "Original account must remain in good standing.",
    ],
    typicalTimeline: "Up to 2 business days",
    policyUrl: "https://www.metrobyt-mobile.com/terms-and-conditions/phone-unlock-policy",
  },
  {
    carrier: "Cricket",
    summary: "Cricket typically unlocks after 6 months of paid active service.",
    eligibilityRules: [
      "At least 6 months of active paid service.",
      "The IMEI must not be blacklisted.",
      "Device must be designed for use on Cricket.",
    ],
    typicalTimeline: "Within 2 business days",
    policyUrl: "https://www.cricketwireless.com/legal-info/device-unlock-policy",
  },
  {
    carrier: "Boost Mobile",
    summary: "Boost can unlock devices after 12 months of active service on eligible plans.",
    eligibilityRules: [
      "12 months of active service in many cases.",
      "Device account balance must be clear.",
      "Device cannot be flagged for abuse or theft.",
    ],
    typicalTimeline: "2 business days",
    policyUrl: "https://www.boostmobile.com/support/legal/device-unlocking-policy",
  },
  {
    carrier: "US Cellular",
    summary: "US Cellular unlock policy is generally 120 days with good standing and clean IMEI.",
    eligibilityRules: [
      "Device must be active for at least 120 days.",
      "Account must be in good standing.",
      "No fraud/loss/stolen reports attached to IMEI.",
    ],
    typicalTimeline: "1-3 business days",
    policyUrl: "https://www.uscellular.com/legal/mobile-wireless-device-unlocking",
  },
];

const GENERIC_POLICY: UnlockPolicy = {
  carrier: "Generic Carrier Policy",
  summary: "When the original carrier is unclear, most US unlock policies require account good standing and a clean IMEI.",
  eligibilityRules: [
    "Device financing must be paid in full.",
    "IMEI cannot be blacklisted for loss, theft, or fraud.",
    "Minimum active-service period may apply (typically 40-180 days).",
  ],
  typicalTimeline: "1-5 business days after eligibility",
  policyUrl: "https://www.fcc.gov/general/cell-phone-unlocking",
};

const CARRIER_ALIASES: Record<string, string> = {
  verizon: "Verizon",
  att: "AT&T",
  "at&t": "AT&T",
  "t-mobile": "T-Mobile",
  tmobile: "T-Mobile",
  metro: "Metro by T-Mobile",
  cricket: "Cricket",
  boost: "Boost Mobile",
  "us cellular": "US Cellular",
  uscellular: "US Cellular",
};

export function getUnlockPolicyForCarrier(carrierName: string): UnlockPolicy {
  const normalized = carrierName.trim().toLowerCase();

  const canonical =
    CARRIER_ALIASES[normalized] ??
    Object.entries(CARRIER_ALIASES).find(([alias]) => normalized.includes(alias))?.[1] ??
    carrierName;

  const exactPolicy = POLICIES.find((policy) => policy.carrier.toLowerCase() === canonical.toLowerCase());

  if (exactPolicy) {
    return exactPolicy;
  }

  return {
    ...GENERIC_POLICY,
    carrier: canonical === "" ? GENERIC_POLICY.carrier : canonical,
  };
}
