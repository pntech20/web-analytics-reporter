export interface InitGA4Options {
  gtagConfig?: Record<string, unknown>;
}

export interface LinkEventContext {
  anchor: HTMLAnchorElement;
  rawHref: string;
  url: URL;
}

export interface LinkEventTrackingOptions {
  linkLocation?: (anchor: HTMLAnchorElement) => string;
  resolveEventName(context: LinkEventContext): string | null | undefined;
}

export function initGA4(measurementId: string, options?: InitGA4Options): void;
export function installLinkEventTracking(options: LinkEventTrackingOptions): void;
export function safeLinkPath(url: URL): string;
export function trackEvent(eventName: string, properties?: Record<string, unknown>): boolean;
