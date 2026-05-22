function integer(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function percentChange(current, previous) {
  if (!previous && !current) return "0%";
  if (!previous && current) return "new";
  const percent = ((current - previous) / previous) * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${Math.round(percent)}%`;
}

function yesterdayLabel(timeZone) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function listSection(items, emptyText) {
  if (!items.length) return emptyText;
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function pathLabel(path, maxLength) {
  const limit = maxLength || 48;
  if (!path || path === "/") return "/";
  return path.length > limit ? `${path.slice(0, limit - 3)}...` : path;
}

function defaultEventLabels() {
  return {
    download_clicked: "Downloads",
    guide_clicked: "Guide clicks",
    support_clicked: "Support clicks",
    external_link_clicked: "External link clicks"
  };
}

function normalizeEventLabels(eventLabels) {
  return Object.assign(defaultEventLabels(), eventLabels || {});
}

function buildDailySummaryMessage(options) {
  const data = options.data;
  const siteName = options.siteName || "Website";
  const timeZone = options.timeZone || "UTC";
  const eventLabels = normalizeEventLabels(options.eventLabels);
  const sections = options.sections || ["traffic", "events", "countries", "sources", "pages", "note"];
  const lines = [`${siteName} daily summary - ${yesterdayLabel(timeZone)}`, ""];

  if (sections.includes("traffic")) {
    lines.push(
      "Traffic",
      `Users: ${integer(data.totals.users)} (${percentChange(data.totals.users, data.previousTotals.users)} vs previous day)`,
      `Sessions: ${integer(data.totals.sessions)} (${percentChange(data.totals.sessions, data.previousTotals.sessions)})`,
      `Views: ${integer(data.totals.views)} (${percentChange(data.totals.views, data.previousTotals.views)})`,
      ""
    );
  }

  if (sections.includes("events")) {
    lines.push("Website actions");
    for (const [eventName, label] of Object.entries(eventLabels)) {
      lines.push(`${label}: ${integer(data.events[eventName] || 0)}`);
    }
    lines.push("");
  }

  if (sections.includes("countries")) {
    const topCountries = data.topCountries.map(
      (country) => `${country.country || "(not set)"} - ${integer(country.users)} users, ${integer(country.sessions)} sessions`
    );
    lines.push("Countries", listSection(topCountries, "No country data yet."), "");
  }

  if (sections.includes("sources")) {
    const topSources = data.topSources.map(
      (source) => `${source.source || "(not set)"} - ${integer(source.sessions)} sessions, ${integer(source.users)} users`
    );
    lines.push("Top sources", listSection(topSources, "No source data yet."), "");
  }

  if (sections.includes("pages")) {
    const topPages = data.topPages.map(
      (page) => `${pathLabel(page.path, options.maxPathLength)} - ${integer(page.views)} views, ${integer(page.users)} users`
    );
    lines.push("Top pages", listSection(topPages, "No page data yet."), "");
  }

  if (sections.includes("note")) {
    lines.push("Note: GA4 can lag, so this report uses yesterday's completed data.");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

module.exports = {
  buildDailySummaryMessage,
  defaultEventLabels,
  integer,
  listSection,
  pathLabel,
  percentChange,
  yesterdayLabel
};
