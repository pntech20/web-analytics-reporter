export type DailySummarySection = "traffic" | "events" | "countries" | "sources" | "pages" | "note";

export interface DailySummaryData {
  totals: {
    users: number;
    sessions: number;
    views: number;
    events: number;
  };
  previousTotals: {
    users: number;
    sessions: number;
    views: number;
    events: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    users: number;
  }>;
  topSources: Array<{
    source: string;
    sessions: number;
    users: number;
  }>;
  topCountries: Array<{
    country: string;
    users: number;
    sessions: number;
  }>;
  events: Record<string, number>;
}

export interface BuildDailySummaryMessageOptions {
  data: DailySummaryData;
  eventLabels?: Record<string, string>;
  maxPathLength?: number;
  sections?: DailySummarySection[];
  siteName?: string;
  timeZone?: string;
}

export function buildDailySummaryMessage(options: BuildDailySummaryMessageOptions): string;
export function defaultEventLabels(): Record<string, string>;
export function integer(value: number): string;
export function listSection(items: string[], emptyText: string): string;
export function pathLabel(path: string, maxLength?: number): string;
export function percentChange(current: number, previous: number): string;
export function yesterdayLabel(timeZone: string): string;
