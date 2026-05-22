import type { RunDailySummaryOptions } from "./runner";

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

export interface VercelDailySummaryHandlerOptions extends Omit<RunDailySummaryOptions, "dryRun" | "site"> {
  allowUnauthenticated?: boolean;
  secret?: string;
}

export function createVercelDailySummaryHandler(
  options: VercelDailySummaryHandlerOptions
): (req: VercelLikeRequest, res: VercelLikeResponse) => Promise<void>;
export function constantTimeEquals(left: string, right: string): boolean;
export function headerValue(req: VercelLikeRequest, name: string): string;
export function isAuthorized(req: VercelLikeRequest, secret?: string, allowUnauthenticated?: boolean): boolean;
export function json(res: VercelLikeResponse, statusCode: number, payload: object): void;
export { AnalyticsSource, ReportDestination, ReporterSiteConfig, normalizeSites, runDailySummary } from "./runner";
