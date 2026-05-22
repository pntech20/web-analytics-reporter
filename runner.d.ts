import type { BuildDailySummaryMessageOptions, DailySummaryData, DailySummarySection } from "./core";

export interface ReporterSiteConfig {
  chatId?: string;
  eventLabels?: Record<string, string>;
  eventNames?: string[];
  ga4PropertyId?: string;
  id: string;
  limits?: object;
  maxPathLength?: number;
  name: string;
  propertyId?: string;
  sections?: DailySummarySection[];
  telegramChatId?: string;
  timeZone?: string;
}

export interface AnalyticsSource {
  dailySummary(site: ReporterSiteConfig, reportOptions?: object): Promise<DailySummaryData>;
}

export interface ReportDestination {
  send(report: { chatId?: string; siteId: string; siteName: string; text: string }): Promise<object | void>;
}

export interface DailySummaryReport {
  dryRun: boolean;
  message: string;
  site: string;
  totals: DailySummaryData["totals"];
}

export interface RunDailySummaryOptions {
  defaultSite?: string;
  destination: ReportDestination;
  dryRun?: boolean;
  eventLabels?: Record<string, string>;
  maxPathLength?: number;
  report?: object;
  sections?: BuildDailySummaryMessageOptions["sections"];
  site?: string;
  sites: ReporterSiteConfig[];
  source: AnalyticsSource;
  timeZone?: string;
}

export interface RunDailySummaryResult {
  ok: true;
  dryRun: boolean;
  reportCount: number;
  reports: DailySummaryReport[];
  message?: string;
  totals?: DailySummaryData["totals"];
}

export function normalizeSites(sites: ReporterSiteConfig[]): ReporterSiteConfig[];
export function runDailySummary(options: RunDailySummaryOptions): Promise<RunDailySummaryResult>;
export function selectedSites(sites: ReporterSiteConfig[], requestedSite?: string): ReporterSiteConfig[];
