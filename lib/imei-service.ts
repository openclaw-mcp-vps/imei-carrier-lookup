import axios from "axios";

import { getUnlockPolicyForCarrier } from "@/lib/carrier-policies";
import {
  CarrierConfidence,
  FraudRiskLevel,
  ImeiLookupResult,
  LookupSource,
  SimLockStatus,
} from "@/lib/types";

interface ProviderDeviceData {
  source: LookupSource;
  brand: string | null;
  model: string | null;
  marketingName: string | null;
  carrier: string | null;
  simLockStatus: SimLockStatus;
  blacklisted: boolean | null;
}

interface TacFallback {
  brand: string;
  model: string;
  marketingName: string;
  carrier?: string;
  simLockStatus?: SimLockStatus;
}

const TAC_FALLBACKS: Record<string, TacFallback> = {
  "49015420": {
    brand: "3GPP Test",
    model: "Reference IMEI",
    marketingName: "GSMA test identifier",
    simLockStatus: "unknown",
  },
  "35391805": {
    brand: "Apple",
    model: "A2484",
    marketingName: "iPhone 13 (regional variant)",
    simLockStatus: "unknown",
  },
  "35175605": {
    brand: "Samsung",
    model: "SM-G998",
    marketingName: "Galaxy S21 Ultra",
    simLockStatus: "unknown",
  },
  "35702210": {
    brand: "Google",
    model: "GD1YQ",
    marketingName: "Pixel 5",
    simLockStatus: "unknown",
  },
};

function sanitizeImei(input: string): string {
  return input.replace(/\D/g, "");
}

function luhnCheck(imei: string): boolean {
  let sum = 0;

  for (let i = 0; i < imei.length; i += 1) {
    let digit = Number.parseInt(imei[i], 10);

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

function pickString(source: Record<string, unknown> | null, keys: string[]): string | null {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function normalizeLockStatus(value: string | null): SimLockStatus {
  if (!value) {
    return "unknown";
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("unlock") || normalized === "open") {
    return "unlocked";
  }

  if (normalized.includes("lock") || normalized.includes("sim restricted")) {
    return "locked";
  }

  return "unknown";
}

function parseBoolean(input: unknown): boolean | null {
  if (typeof input === "boolean") {
    return input;
  }

  if (typeof input === "string") {
    const value = input.toLowerCase().trim();

    if (["true", "yes", "y", "1", "blacklisted", "blocked"].includes(value)) {
      return true;
    }

    if (["false", "no", "n", "0", "clean", "not blacklisted"].includes(value)) {
      return false;
    }
  }

  return null;
}

function parseProviderPayload(raw: unknown, source: LookupSource): ProviderDeviceData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const asRecord = raw as Record<string, unknown>;
  const nestedData = (typeof asRecord.data === "object" ? asRecord.data : null) as Record<string, unknown> | null;

  const brand =
    pickString(asRecord, ["brand", "manufacturer", "maker", "vendor"]) ||
    pickString(nestedData, ["brand", "manufacturer", "maker", "vendor"]);
  const model =
    pickString(asRecord, ["model", "model_name", "device_model", "device"])
    || pickString(nestedData, ["model", "model_name", "device_model", "device"]);
  const marketingName =
    pickString(asRecord, ["name", "marketing_name", "device_name"]) ||
    pickString(nestedData, ["name", "marketing_name", "device_name"]);

  const carrier =
    pickString(asRecord, ["carrier", "operator", "network", "network_operator"]) ||
    pickString(nestedData, ["carrier", "operator", "network", "network_operator"]);

  const lockStatusRaw =
    pickString(asRecord, ["sim_lock", "simlock", "lock_status", "sim_lock_status"]) ||
    pickString(nestedData, ["sim_lock", "simlock", "lock_status", "sim_lock_status"]);

  const blacklisted =
    parseBoolean(asRecord.blacklisted) ??
    parseBoolean(asRecord.blacklist_status) ??
    parseBoolean(nestedData?.blacklisted) ??
    parseBoolean(nestedData?.blacklist_status);

  if (!brand && !model && !marketingName) {
    return null;
  }

  return {
    source,
    brand,
    model,
    marketingName,
    carrier,
    simLockStatus: normalizeLockStatus(lockStatusRaw),
    blacklisted,
  };
}

async function fetchHiCellTekData(imei: string): Promise<ProviderDeviceData | null> {
  const key = process.env.HICELLTEK_API_KEY;

  if (!key) {
    return null;
  }

  try {
    const response = await axios.post(
      "https://imei.hicelltek.com/api/v1/tac/lookup",
      { q: imei },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "User-Agent": "imei-carrier-lookup/1.0",
        },
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 500,
      },
    );

    if (response.status >= 400) {
      return null;
    }

    return parseProviderPayload(response.data, "hicelltek");
  } catch {
    return null;
  }
}

async function fetchDeviceCheckData(imei: string): Promise<ProviderDeviceData | null> {
  const token = process.env.DEVICECHECK_API_TOKEN;

  if (!token) {
    return null;
  }

  try {
    const response = await axios.post(
      process.env.DEVICECHECK_API_URL || "https://devicecheck.us/api/v2/checkimei",
      {
        token,
        service: "tac_data",
        imei,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "imei-carrier-lookup/1.0",
        },
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 500,
      },
    );

    if (response.status >= 400) {
      return null;
    }

    return parseProviderPayload(response.data, "devicecheck");
  } catch {
    return null;
  }
}

function tacFallback(tac: string): ProviderDeviceData {
  const fallback = TAC_FALLBACKS[tac];

  if (!fallback) {
    return {
      source: "local",
      brand: null,
      model: null,
      marketingName: null,
      carrier: null,
      simLockStatus: "unknown",
      blacklisted: null,
    };
  }

  return {
    source: "local",
    brand: fallback.brand,
    model: fallback.model,
    marketingName: fallback.marketingName,
    carrier: fallback.carrier ?? null,
    simLockStatus: fallback.simLockStatus ?? "unknown",
    blacklisted: null,
  };
}

function inferCarrier(inputCarrier: string | null, brand: string, model: string): {
  name: string;
  confidence: CarrierConfidence;
  reason: string;
} {
  const source = (inputCarrier || `${brand} ${model}`).toLowerCase();

  const candidateMap: Array<{ name: string; match: string[]; confidence: CarrierConfidence; reason: string }> = [
    {
      name: "Verizon",
      match: ["verizon", "vzw"],
      confidence: "high",
      reason: "Carrier marker matched Verizon identifiers.",
    },
    {
      name: "AT&T",
      match: ["at&t", "att", "cricket"],
      confidence: "high",
      reason: "Carrier marker matched AT&T family identifiers.",
    },
    {
      name: "T-Mobile",
      match: ["t-mobile", "tmobile", "metro", "mint"],
      confidence: "high",
      reason: "Carrier marker matched T-Mobile family identifiers.",
    },
    {
      name: "Boost Mobile",
      match: ["boost"],
      confidence: "medium",
      reason: "Carrier marker matched Boost-specific keywords.",
    },
  ];

  for (const candidate of candidateMap) {
    if (candidate.match.some((keyword) => source.includes(keyword))) {
      return {
        name: candidate.name,
        confidence: candidate.confidence,
        reason: candidate.reason,
      };
    }
  }

  return {
    name: "Unspecified (likely open-market)",
    confidence: "low",
    reason: "IMEI alone does not encode active carrier for most devices.",
  };
}

function getFraudSignals(input: {
  imei: string;
  isValid: boolean;
  source: LookupSource;
  modelKnown: boolean;
  blacklisted: boolean | null;
  simLockStatus: SimLockStatus;
  carrierConfidence: CarrierConfidence;
}): { score: number; level: FraudRiskLevel; signals: string[] } {
  if (!input.isValid) {
    return {
      score: 95,
      level: "high",
      signals: [
        "IMEI failed Luhn checksum validation.",
        "Invalid IMEI format is a common fraud indicator in used-phone listings.",
      ],
    };
  }

  let score = 34;
  const signals: string[] = [];

  if (input.modelKnown) {
    score -= 12;
    signals.push("Device model resolved from TAC or provider data.");
  } else {
    score += 12;
    signals.push("TAC could not be matched to a known device model.");
  }

  if (input.source === "local") {
    score += 9;
    signals.push("External provider did not return full identity data.");
  } else {
    score -= 8;
    signals.push("Third-party IMEI provider returned live metadata.");
  }

  if (input.blacklisted === true) {
    score += 35;
    signals.push("Provider flagged this IMEI as blacklisted or blocked.");
  }

  if (input.blacklisted === false) {
    score -= 8;
    signals.push("Provider reported a clean blacklist state.");
  }

  if (input.simLockStatus === "locked") {
    score += 10;
    signals.push("Device appears SIM-locked, which can complicate resale value.");
  }

  if (input.carrierConfidence === "low") {
    score += 6;
    signals.push("Carrier identity confidence is low.");
  }

  if (/^(\d)\1{14}$/.test(input.imei)) {
    score += 20;
    signals.push("IMEI has repeated digits pattern often used in fake listings.");
  }

  if (["123456789012345", "111111111111111", "000000000000000"].includes(input.imei)) {
    score += 30;
    signals.push("IMEI matches a known fake/demo pattern.");
  }

  score = Math.min(100, Math.max(1, score));

  let level: FraudRiskLevel = "low";

  if (score >= 65) {
    level = "high";
  } else if (score >= 35) {
    level = "medium";
  }

  return {
    score,
    level,
    signals,
  };
}

export async function lookupImeiDetails(rawInput: string): Promise<ImeiLookupResult> {
  const imei = sanitizeImei(rawInput);
  const tac = imei.slice(0, 8);
  const isValid = imei.length === 15 && luhnCheck(imei);

  const notes: string[] = [];

  let providerData = await fetchHiCellTekData(imei);

  if (!providerData) {
    providerData = await fetchDeviceCheckData(imei);
  }

  if (!providerData) {
    providerData = tacFallback(tac);
    notes.push(
      "External IMEI providers were unavailable or not configured. Showing TAC-based intelligence with reduced certainty.",
    );
  }

  const brand = providerData.brand || "Unknown";
  const model = providerData.model || "Unknown model";
  const marketingName = providerData.marketingName || `${brand} ${model}`.trim();

  const carrierInference = inferCarrier(providerData.carrier, brand, model);
  const unlockPolicy = getUnlockPolicyForCarrier(carrierInference.name);

  const fraud = getFraudSignals({
    imei,
    isValid,
    source: providerData.source,
    modelKnown: model !== "Unknown model",
    blacklisted: providerData.blacklisted,
    simLockStatus: providerData.simLockStatus,
    carrierConfidence: carrierInference.confidence,
  });

  if (providerData.source !== "local") {
    notes.push("Result includes live data from an external IMEI database provider.");
  }

  if (providerData.source === "local" && !process.env.HICELLTEK_API_KEY && !process.env.DEVICECHECK_API_TOKEN) {
    notes.push("Add HICELLTEK_API_KEY or DEVICECHECK_API_TOKEN for stronger carrier and lock-confidence data.");
  }

  return {
    imei,
    tac,
    lookedUpAt: new Date().toISOString(),
    isValidImei: isValid,
    device: {
      brand,
      model,
      marketingName,
      source: providerData.source,
    },
    carrier: {
      name: carrierInference.name,
      confidence: carrierInference.confidence,
      simLockStatus: providerData.simLockStatus,
      reason: carrierInference.reason,
    },
    unlockPolicy,
    fraud,
    notes,
  };
}
