import type { BuildDailySummaryMessageOptions, DailySummaryData, DailySummarySection } from "./core";

export interface VercelLikeRequest {
  headers: Record<string, string | undefined>;
  method: string;
  url: string;
}

export interface VercelLikeResponse {
  end(chunk: string): void;
  setHeader(name: string, value: string): void;
  statusCode: number;
}

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
  send(report: { chatId?: string; siteId: string; siteName: string; text: string }): Promise<object>;
}

export interface VercelDailySummaryHandlerOptions {
  allowUnauthenticated?: boolean;
  defaultSite?: string;
  destination: ReportDestination;
  eventLabels?: Record<string, string>;
  maxPathLength?: number;
  report?: object;
  secret?: string;
  sections?: BuildDailySummaryMessageOptions["sections"];
  sites: ReporterSiteConfig[];
  source: AnalyticsSource;
  timeZone?: string;
}

export function createVercelDailySummaryHandler(
  options: VercelDailySummaryHandlerOptions
): (req: VercelLikeRequest, res: VercelLikeResponse) => Promise<void>;
export function constantTimeEquals(left: string, right: string): boolean;
export function headerValue(req: VercelLikeRequest, name: string): string;
export function isAuthorized(req: VercelLikeRequest, secret?: string, allowUnauthenticated?: boolean): boolean;
export function json(res: VercelLikeResponse, statusCode: number, payload: object): void;
