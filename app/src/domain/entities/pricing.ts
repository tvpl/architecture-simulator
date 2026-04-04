// ─── AWS Regions ─────────────────────────────────────────────────────────────

export const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "sa-east-1",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
] as const;

export type AWSRegion = (typeof AWS_REGIONS)[number];

export const REGION_DISPLAY_NAMES: Record<AWSRegion, string> = {
  "us-east-1": "US East (N. Virginia)",
  "us-east-2": "US East (Ohio)",
  "us-west-1": "US West (N. California)",
  "us-west-2": "US West (Oregon)",
  "sa-east-1": "South America (São Paulo)",
  "eu-west-1": "Europe (Ireland)",
  "eu-central-1": "Europe (Frankfurt)",
  "ap-southeast-1": "Asia Pacific (Singapore)",
  "ap-northeast-1": "Asia Pacific (Tokyo)",
};

// ─── Pricing Tier ────────────────────────────────────────────────────────────

export type PricingModel = "on-demand" | "reserved-1y" | "reserved-3y" | "spot";

export interface PricingTier {
  model: PricingModel;
  region: AWSRegion;
  pricePerUnit: number;
  unit: string;
  freetier?: number;
}
