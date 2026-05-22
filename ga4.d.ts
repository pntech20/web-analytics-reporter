import type { DailySummaryData } from "./core";

export interface Ga4SourceOptions {
  clientEmail: string;
  eventNames?: string[];
  limits?: Ga4SummaryLimits;
  privateKey: string;
  propertyId?: string;
}

export interface Ga4SummaryLimits {
  countries?: number;
  events?: number;
  pages?: number;
  sources?: number;
}

export interface Ga4SiteConfig {
  eventNames?: string[];
  ga4PropertyId?: string;
  id?: string;
  limits?: Ga4SummaryLimits;
  name?: string;
  propertyId?: string;
}

export interface Ga4DailySummaryOptions {
  eventNames?: string[];
  limits?: Ga4SummaryLimits;
}

export interface Ga4Source {
  type: "ga4";
  dailySummary(site: Ga4SiteConfig, reportOptions?: Ga4DailySummaryOptions): Promise<DailySummaryData>;
  getAccessToken(): Promise<string>;
}

export function createServiceAccountJwt(options: { clientEmail: string; privateKey: string }): string;
export function defaultEventNames(): string[];
export function fetchGa4DailySummary(options: {
  accessToken: string;
  eventNames?: string[];
  limits?: Ga4SummaryLimits;
  propertyId: string;
}): Promise<DailySummaryData>;
export function ga4Source(options: Ga4SourceOptions): Ga4Source;
export function getGoogleAccessToken(options: { clientEmail: string; privateKey: string }): Promise<string>;
export function normalizePrivateKey(privateKey: string): string;
export function runGa4Report(options: { accessToken: string; body: object; propertyId: string }): Promise<object>;
