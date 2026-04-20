const PUBLIC_TAC_DB_CSV_URL =
  "https://raw.githubusercontent.com/VTSTech/IMEIDB/master/imeidb.csv";

type Confidence = "high" | "medium" | "low";
type RiskLevel = "low" | "medium" | "high";

type TacRecord = {
  manufacturer: string;
  model: string;
};

export type ImeiLookupResult = {
  imei: string;
  tac: string;
  checkedAt: string;
  source: string;
  device: {
    manufacturer: string;
    model: string;
    confidence: Confidence;
    tacMatched: boolean;
  };
  carrier: {
    name: string;
    confidence: Confidence;
  };
  simLockStatus: string;
  unlockPolicy: {
    summary: string;
    requirements: string[];
    source: string;
  };
  fraudRisk: {
    score: number;
    level: RiskLevel;
    reasons: string[];
  };
  recommendations: string[];
};

const FALLBACK_TACS: Record<string, TacRecord> = {
  "35722306": {
    manufacturer: "Samsung",
    model: "Galaxy Note 4 Edge (SM-N915W8)"
  },
  "35391505": {
    manufacturer: "Apple",
    model: "iPhone 6s"
  },
  "35209910": {
    manufacturer: "Apple",
    model: "iPhone 11"
  }
};

const CARRIER_POLICIES: Record<
  string,
  { summary: string; requirements: string[]; source: string }
> = {
  Verizon: {
    summary:
      "Most Verizon consumer devices sold in the US auto-unlock after a short lock window when fraud checks pass.",
    requirements: [
      "Device must not be reported as lost, stolen, or fraud-flagged.",
      "A short initial lock window can apply after purchase.",
      "Business and deployed fleet lines can have different rules."
    ],
    source: "https://www.verizon.com/about/consumer-safety/device-unlocking-policy"
  },
  "AT&T": {
    summary:
      "AT&T unlocks paid-off devices that have been active long enough and are not tied to fraud or overdue balances.",
    requirements: [
      "Installment plans must be fully paid.",
      "Device cannot be tied to fraud, theft, or unpaid balances.",
      "Account holder must meet AT&T unlock eligibility requirements."
    ],
    source: "https://www.att.com/deviceunlock/"
  },
  "T-Mobile": {
    summary:
      "T-Mobile generally unlocks eligible devices after payoff and a minimum active period on the network.",
    requirements: [
      "Device financing must be completed.",
      "Account must be in good standing.",
      "Device must not be blocked by fraud or loss reports."
    ],
    source: "https://www.t-mobile.com/support/devices/unlock-your-mobile-wireless-device"
  },
  "Factory Unlocked": {
    summary:
      "Factory-unlocked devices are typically free to use on any compatible carrier.",
    requirements: [
      "Verify blacklist status before purchase.",
      "Check US band compatibility for your destination carrier.",
      "Confirm no MDM or enterprise lock is present."
    ],
    source: "https://www.fcc.gov/consumers/guides/cell-phone-unlocking-faqs"
  },
  Unknown: {
    summary:
      "Carrier lock status is unclear from TAC data alone; verify directly with the seller or carrier before buying.",
    requirements: [
      "Request proof of payoff and unlock approval.",
      "Test with your own SIM or eSIM trial before final payment.",
      "Check blacklist status with the target carrier."
    ],
    source: "https://www.fcc.gov/consumers/guides/cell-phone-unlocking-faqs"
  }
};

let tacDatabasePromise: Promise<Map<string, TacRecord>> | null = null;

function normalizeImei(imei: string): string {
  return imei.replace(/\D/g, "").trim();
}

function luhnIsValid(value: string): boolean {
  if (!/^\d{15}$/.test(value)) {
    return false;
  }

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
}

function cleanManufacturer(raw: string): string {
  return raw
    .replace(/\b(CO|CORP|CORPORATION|LTD|LIMITED|INC|LLC|ELECTRONICS|COMMUNICATIONS)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadTacDatabase(): Promise<Map<string, TacRecord>> {
  if (tacDatabasePromise) {
    return tacDatabasePromise;
  }

  tacDatabasePromise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch(PUBLIC_TAC_DB_CSV_URL, {
        signal: controller.signal,
        next: { revalidate: 60 * 60 * 24 }
      });

      if (!response.ok) {
        throw new Error(`Unable to load TAC DB: ${response.status}`);
      }

      const csv = await response.text();
      const map = new Map<string, TacRecord>();

      for (const line of csv.split(/\r?\n/)) {
        if (!line || !/^\d{8},/.test(line)) {
          continue;
        }

        const parts = line.split(",");
        const tac = parts[0]?.trim();
        const manufacturer = parts[1]?.trim();
        const model = parts[2]?.trim();

        if (!tac || !manufacturer || !model) {
          continue;
        }

        map.set(tac, {
          manufacturer: cleanManufacturer(manufacturer),
          model
        });
      }

      return map;
    } catch {
      return new Map<string, TacRecord>();
    } finally {
      clearTimeout(timeout);
    }
  })();

  return tacDatabasePromise;
}

async function resolveTac(tac: string): Promise<{ record: TacRecord | null; source: string }> {
  const tacDb = await loadTacDatabase();
  const record = tacDb.get(tac);

  if (record) {
    return {
      record,
      source: "VTSTech IMEIDB via GitHub"
    };
  }

  if (FALLBACK_TACS[tac]) {
    return {
      record: FALLBACK_TACS[tac],
      source: "Curated fallback TAC dictionary"
    };
  }

  return {
    record: null,
    source: "Heuristic inference"
  };
}

function inferCarrier(manufacturer: string, model: string): {
  name: string;
  confidence: Confidence;
} {
  const fingerprint = `${manufacturer} ${model}`.toUpperCase();

  if (/\b(VZW|VERIZON|US VERSIONS? V)\b/.test(fingerprint)) {
    return { name: "Verizon", confidence: "high" };
  }

  if (/\b(AT&T|ATT|AIO|CRICKET)\b/.test(fingerprint)) {
    return { name: "AT&T", confidence: "medium" };
  }

  if (/\b(TMO|T-MOBILE|METRO PCS|METROPCS|TMOBILE)\b/.test(fingerprint)) {
    return { name: "T-Mobile", confidence: "medium" };
  }

  if (/\b(U1|FACTORY UNLOCK|SIM FREE|UNLOCKED)\b/.test(fingerprint)) {
    return { name: "Factory Unlocked", confidence: "high" };
  }

  if (/APPLE|GOOGLE PIXEL|MOTOROLA|ONEPLUS|NOTHING/.test(fingerprint)) {
    return { name: "Factory Unlocked", confidence: "medium" };
  }

  return { name: "Unknown", confidence: "low" };
}

function inferSimLockStatus(carrier: string, carrierConfidence: Confidence): string {
  if (carrier === "Factory Unlocked") {
    return "Likely unlocked for compatible carriers.";
  }

  if (carrier === "Unknown") {
    return "Unknown. Ask for carrier unlock proof before buying.";
  }

  if (carrierConfidence === "high") {
    return `Likely locked to ${carrier} until the original account obligations are cleared.`;
  }

  return `Possibly locked to ${carrier}. Verify unlock eligibility with the original carrier.`;
}

function calculateFraudRisk(input: {
  imei: string;
  tacMatched: boolean;
  carrierConfidence: Confidence;
  model: string;
}): { score: number; level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  let score = 18;

  if (!input.tacMatched) {
    score += 28;
    reasons.push("TAC was not found in the external device database.");
  }

  if (input.carrierConfidence === "low") {
    score += 14;
    reasons.push("Carrier attribution is weak from available metadata.");
  }

  if (input.carrierConfidence === "medium") {
    score += 6;
    reasons.push("Carrier estimate is plausible but not definitive.");
  }

  if (/UNKNOWN|GENERIC|TEST/i.test(input.model)) {
    score += 15;
    reasons.push("Model metadata is generic, which raises resale risk.");
  }

  const serialBlock = input.imei.slice(8, 14);
  if (/^(\d)\1+$/.test(serialBlock)) {
    score += 16;
    reasons.push("Serial section has repetitive digits, common in bad IMEI lists.");
  }

  if (new Set(serialBlock).size <= 2) {
    score += 10;
    reasons.push("Serial section has low entropy.");
  }

  score = Math.max(1, Math.min(score, 99));

  let level: RiskLevel = "low";
  if (score >= 66) {
    level = "high";
  } else if (score >= 36) {
    level = "medium";
  }

  if (reasons.length === 0) {
    reasons.push("No major structural anomalies detected from IMEI + TAC signals.");
  }

  return { score, level, reasons };
}

function buildRecommendations(input: {
  riskLevel: RiskLevel;
  carrier: string;
  tacMatched: boolean;
}): string[] {
  const tips: string[] = [];

  if (!input.tacMatched) {
    tips.push(
      "Request a photo of the IMEI label in Settings and on the original box to catch mismatches."
    );
  }

  if (input.carrier !== "Factory Unlocked") {
    tips.push(
      "Before payment, run an unlock eligibility check with the identified carrier and confirm no unpaid installments."
    );
  }

  if (input.riskLevel !== "low") {
    tips.push(
      "Use a protected payment method and include an IMEI match clause in your bill of sale."
    );
  }

  tips.push("Test activation with your target SIM or eSIM trial before finalizing the purchase.");
  return tips;
}

export function validateImei(imei: string): { valid: boolean; normalized: string } {
  const normalized = normalizeImei(imei);
  return {
    valid: luhnIsValid(normalized),
    normalized
  };
}

export async function lookupImei(imeiInput: string): Promise<ImeiLookupResult> {
  const { normalized: imei, valid } = validateImei(imeiInput);

  if (!valid) {
    throw new Error("Please provide a valid 15-digit IMEI.");
  }

  const tac = imei.slice(0, 8);
  const tacResolution = await resolveTac(tac);

  const device = tacResolution.record
    ? {
        manufacturer: tacResolution.record.manufacturer || "Unknown",
        model: tacResolution.record.model || "Unknown",
        confidence: "high" as Confidence,
        tacMatched: true
      }
    : {
        manufacturer: "Unknown",
        model: "Unknown model",
        confidence: "low" as Confidence,
        tacMatched: false
      };

  const carrier = inferCarrier(device.manufacturer, device.model);
  const simLockStatus = inferSimLockStatus(carrier.name, carrier.confidence);

  const unlockPolicy = CARRIER_POLICIES[carrier.name] ?? CARRIER_POLICIES.Unknown;

  const fraudRisk = calculateFraudRisk({
    imei,
    tacMatched: device.tacMatched,
    carrierConfidence: carrier.confidence,
    model: device.model
  });

  const recommendations = buildRecommendations({
    riskLevel: fraudRisk.level,
    carrier: carrier.name,
    tacMatched: device.tacMatched
  });

  return {
    imei,
    tac,
    checkedAt: new Date().toISOString(),
    source: tacResolution.source,
    device,
    carrier,
    simLockStatus,
    unlockPolicy,
    fraudRisk,
    recommendations
  };
}
