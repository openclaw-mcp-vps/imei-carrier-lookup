import axios from "axios";

export type ImeiLookupResult = {
  imei: string;
  model: string;
  manufacturer: string;
  deviceType: string;
  carrier: string;
  simLockStatus: "Locked" | "Unlocked" | "Unknown";
  unlockPolicy: string;
  fraudRiskScore: number;
  fraudRiskLevel: "Low" | "Medium" | "High";
  fraudSignals: string[];
  confidence: "High" | "Medium" | "Low";
  source: "live" | "local";
  tac: string;
};

type TacRecord = {
  manufacturer: string;
  model: string;
  deviceType: string;
  likelyCarrier?: string;
  likelyLockStatus?: "Locked" | "Unlocked";
  releaseYear?: number;
};

const TAC_DATABASE: Record<string, TacRecord> = {
  "35693803": {
    manufacturer: "Apple",
    model: "iPhone 15 Pro",
    deviceType: "Smartphone",
    likelyCarrier: "Factory Unlocked",
    likelyLockStatus: "Unlocked",
    releaseYear: 2023
  },
  "35391505": {
    manufacturer: "Apple",
    model: "iPhone 14",
    deviceType: "Smartphone",
    likelyCarrier: "Factory Unlocked",
    likelyLockStatus: "Unlocked",
    releaseYear: 2022
  },
  "35025211": {
    manufacturer: "Apple",
    model: "iPhone 13",
    deviceType: "Smartphone",
    likelyCarrier: "AT&T",
    likelyLockStatus: "Locked",
    releaseYear: 2021
  },
  "35451814": {
    manufacturer: "Apple",
    model: "iPhone 12",
    deviceType: "Smartphone",
    likelyCarrier: "Verizon",
    likelyLockStatus: "Unlocked",
    releaseYear: 2020
  },
  "35120950": {
    manufacturer: "Samsung",
    model: "Galaxy S24",
    deviceType: "Smartphone",
    likelyCarrier: "T-Mobile",
    likelyLockStatus: "Locked",
    releaseYear: 2024
  },
  "35963510": {
    manufacturer: "Samsung",
    model: "Galaxy S23",
    deviceType: "Smartphone",
    likelyCarrier: "Factory Unlocked",
    likelyLockStatus: "Unlocked",
    releaseYear: 2023
  },
  "35726517": {
    manufacturer: "Google",
    model: "Pixel 8",
    deviceType: "Smartphone",
    likelyCarrier: "Google Fi",
    likelyLockStatus: "Unlocked",
    releaseYear: 2023
  },
  "35503127": {
    manufacturer: "Google",
    model: "Pixel 7",
    deviceType: "Smartphone",
    likelyCarrier: "Google Fi",
    likelyLockStatus: "Unlocked",
    releaseYear: 2022
  },
  "86351306": {
    manufacturer: "Motorola",
    model: "Moto G Power",
    deviceType: "Smartphone",
    likelyCarrier: "Boost Mobile",
    likelyLockStatus: "Locked",
    releaseYear: 2021
  },
  "86150905": {
    manufacturer: "OnePlus",
    model: "OnePlus 11",
    deviceType: "Smartphone",
    likelyCarrier: "Factory Unlocked",
    likelyLockStatus: "Unlocked",
    releaseYear: 2023
  }
};

const CARRIER_UNLOCK_POLICIES: Record<string, string> = {
  "AT&T":
    "AT&T unlocks eligible devices that are fully paid off, not reported lost/stolen, and active on the account for required periods.",
  "T-Mobile":
    "T-Mobile generally requires the device to be paid off, in good standing, and active on the network before permanent unlock approval.",
  Verizon:
    "Verizon devices are usually locked for the first 60 days after purchase/activation, then unlock automatically when policy conditions are met.",
  "Google Fi": "Google Fi and Pixel devices are typically sold unlocked unless financed under specific partner terms.",
  "Boost Mobile":
    "Boost Mobile often requires a defined continuous service window and account good standing before device unlock eligibility.",
  "Factory Unlocked": "Factory unlocked devices are not tied to a carrier lock and can be used with compatible SIMs."
};

function luhnCheck(imei: string) {
  let sum = 0;

  for (let i = 0; i < imei.length; i += 1) {
    let digit = Number.parseInt(imei[i] ?? "0", 10);

    if ((i + 1) % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

function normalizeCarrier(carrier: string | undefined) {
  if (!carrier) {
    return "Unknown";
  }

  if (carrier.toLowerCase().includes("att")) {
    return "AT&T";
  }
  if (carrier.toLowerCase().includes("verizon")) {
    return "Verizon";
  }
  if (carrier.toLowerCase().includes("t-mobile")) {
    return "T-Mobile";
  }

  return carrier;
}

async function fetchLiveCarrierData(imei: string) {
  const endpoint = process.env.IMEI_PROVIDER_URL;
  if (!endpoint) {
    return null;
  }

  try {
    const response = await axios.get(endpoint, {
      timeout: 10000,
      params: { imei },
      headers: {
        ...(process.env.IMEI_PROVIDER_API_KEY
          ? {
              Authorization: `Bearer ${process.env.IMEI_PROVIDER_API_KEY}`
            }
          : {})
      }
    });

    const data = response.data as Record<string, unknown>;

    return {
      model:
        (data.model as string | undefined) ||
        ((data.device as Record<string, unknown> | undefined)?.model as string | undefined),
      manufacturer:
        (data.manufacturer as string | undefined) ||
        ((data.device as Record<string, unknown> | undefined)?.brand as string | undefined),
      carrier:
        (data.carrier as string | undefined) ||
        ((data.network as Record<string, unknown> | undefined)?.carrier as string | undefined),
      simLockStatus:
        ((data.simLockStatus as string | undefined) || (data.lock_status as string | undefined)) ?? undefined,
      blacklisted:
        (data.blacklisted as boolean | undefined) ||
        ((data.fraud as Record<string, unknown> | undefined)?.blacklisted as boolean | undefined)
    };
  } catch {
    return null;
  }
}

function calculateFraudSignals(input: {
  imei: string;
  tacRecord?: TacRecord;
  simLockStatus: "Locked" | "Unlocked" | "Unknown";
  blacklisted?: boolean;
}) {
  const nowYear = new Date().getUTCFullYear();
  let score = 12;
  const signals: string[] = [];

  if (!luhnCheck(input.imei)) {
    score += 55;
    signals.push("IMEI failed checksum validation.");
  }

  if (!input.tacRecord) {
    score += 18;
    signals.push("TAC not recognized in local model library.");
  }

  if (input.tacRecord?.releaseYear && nowYear - input.tacRecord.releaseYear >= 6) {
    score += 8;
    signals.push("Device generation is old enough to warrant battery/parts verification.");
  }

  if (input.simLockStatus === "Locked") {
    score += 10;
    signals.push("Carrier lock present; verify unlock eligibility before resale.");
  }

  if (input.blacklisted) {
    score += 35;
    signals.push("Upstream provider flagged blacklist risk.");
  }

  if (/^(\d)\1+$/.test(input.imei)) {
    score += 20;
    signals.push("IMEI pattern is suspiciously repetitive.");
  }

  score = Math.min(100, Math.max(0, score));

  let level: "Low" | "Medium" | "High" = "Low";
  if (score >= 65) {
    level = "High";
  } else if (score >= 35) {
    level = "Medium";
  }

  return { score, level, signals };
}

function toLockStatus(status: string | undefined, fallback?: "Locked" | "Unlocked") {
  if (!status) {
    return fallback || "Unknown";
  }

  const normalized = status.toLowerCase();
  if (normalized.includes("unlock")) {
    return "Unlocked";
  }
  if (normalized.includes("lock")) {
    return "Locked";
  }

  return fallback || "Unknown";
}

export async function lookupImei(rawImei: string): Promise<ImeiLookupResult> {
  const imei = rawImei.replace(/\D/g, "");

  if (imei.length !== 15) {
    throw new Error("IMEI must contain exactly 15 digits.");
  }

  if (!luhnCheck(imei)) {
    throw new Error("IMEI checksum is invalid. Double-check for typos.");
  }

  const tac = imei.slice(0, 8);
  const tacRecord = TAC_DATABASE[tac];
  const live = await fetchLiveCarrierData(imei);

  const carrier = normalizeCarrier(live?.carrier || tacRecord?.likelyCarrier) || "Unknown";
  const simLockStatus = toLockStatus(live?.simLockStatus, tacRecord?.likelyLockStatus);
  const unlockPolicy =
    CARRIER_UNLOCK_POLICIES[carrier] ||
    "Carrier policy not matched. Confirm account standing, financing status, and theft/blacklist records with the original carrier.";

  const fraud = calculateFraudSignals({
    imei,
    tacRecord,
    simLockStatus,
    blacklisted: live?.blacklisted
  });

  const confidence: "High" | "Medium" | "Low" = live
    ? "High"
    : tacRecord
      ? "Medium"
      : "Low";

  return {
    imei,
    tac,
    model: live?.model || tacRecord?.model || "Unknown model",
    manufacturer: live?.manufacturer || tacRecord?.manufacturer || "Unknown manufacturer",
    deviceType: tacRecord?.deviceType || "Mobile Device",
    carrier,
    simLockStatus,
    unlockPolicy,
    fraudRiskScore: fraud.score,
    fraudRiskLevel: fraud.level,
    fraudSignals: fraud.signals,
    source: live ? "live" : "local",
    confidence
  };
}
