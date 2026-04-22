export type LookupSource = "hicelltek" | "devicecheck" | "local";

export type CarrierConfidence = "high" | "medium" | "low";

export type SimLockStatus = "locked" | "unlocked" | "unknown";

export type FraudRiskLevel = "low" | "medium" | "high";

export interface UnlockPolicy {
  carrier: string;
  summary: string;
  eligibilityRules: string[];
  typicalTimeline: string;
  policyUrl: string;
}

export interface ImeiLookupResult {
  imei: string;
  tac: string;
  lookedUpAt: string;
  isValidImei: boolean;
  device: {
    brand: string;
    model: string;
    marketingName: string;
    source: LookupSource;
  };
  carrier: {
    name: string;
    confidence: CarrierConfidence;
    simLockStatus: SimLockStatus;
    reason: string;
  };
  unlockPolicy: UnlockPolicy;
  fraud: {
    score: number;
    level: FraudRiskLevel;
    signals: string[];
  };
  notes: string[];
}

export interface LookupSuccessResponse {
  ok: true;
  data: ImeiLookupResult;
  access: {
    mode: "free" | "single-paid" | "unlimited-paid";
    remainingLookups: number | null;
  };
}

export interface LookupErrorResponse {
  ok: false;
  error: string;
  paywall?: {
    required: boolean;
    paymentLink?: string;
    message: string;
  };
}

export type LookupApiResponse = LookupSuccessResponse | LookupErrorResponse;

export type AccessTier = "single" | "unlimited";

export interface ActiveEntitlement {
  hasAccess: boolean;
  tier: AccessTier | null;
  remainingLookups: number;
  expiresAt: string | null;
}
