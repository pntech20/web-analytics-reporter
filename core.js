function integer(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function percentChange(current, previous) {
  if (!previous && !current) return "no change";
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

function countPhrase(value, singular, plural) {
  const count = value || 0;
  const label = count === 1 ? singular : (plural || `${singular}s`);
  return `${integer(count)} ${label}`;
}

function metricSummary(metrics) {
  const visible = metrics.filter((metric) => metric.value > 0);
  const items = visible.length ? visible : metrics.slice(0, 1);
  return items.map((metric) => countPhrase(metric.value, metric.singular, metric.plural)).join(", ");
}

function pathLabel(path, maxLength) {
  const limit = maxLength || 48;
  if (!path || path === "/") return "/";
  return path.length > limit ? `${path.slice(0, limit - 3)}...` : path;
}

function displayCountry(country) {
  if (!country || country === "(not set)") return "Unknown location";
  return country;
}

function titleWord(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function displaySourcePart(source) {
  if (!source || source === "(not set)" || source === "(none)") return "";
  const normalized = source.toLowerCase();
  if (normalized === "google") return "Google";
  if (normalized === "bing") return "Bing";
  if (normalized === "chatgpt.com") return "ChatGPT";
  if (normalized.startsWith("perplexity")) return "Perplexity";
  if (normalized === "(direct)") return "Direct";
  return source;
}

function displayMediumPart(medium) {
  if (!medium || medium === "(not set)" || medium === "(none)") return "";
  return titleWord(medium.toLowerCase());
}

function displaySource(sourceMedium) {
  if (!sourceMedium || sourceMedium === "(not set)") return "Unknown source";
  const [source, medium] = sourceMedium.split(" / ");
  const sourceLabel = displaySourcePart(source);
  const mediumLabel = displayMediumPart(medium);
  if (sourceLabel === "Direct") return "Direct";
  if (sourceLabel && mediumLabel) return `${sourceLabel} ${mediumLabel}`;
  return sourceLabel || mediumLabel || "Unknown source";
}

function combineSources(sources) {
  const byLabel = new Map();
  for (const source of sources) {
    const label = displaySource(source.source);
    const existing = byLabel.get(label) || { label, sessions: 0, users: 0 };
    existing.sessions += source.sessions || 0;
    existing.users += source.users || 0;
    byLabel.set(label, existing);
  }
  return Array.from(byLabel.values()).sort((a, b) => b.sessions - a.sessions || b.users - a.users);
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
  const lines = [`${siteName} daily summary`, yesterdayLabel(timeZone), ""];

  if (sections.includes("traffic")) {
    lines.push(
      "Traffic",
      `Users: ${integer(data.totals.users)} (${percentChange(data.totals.users, data.previousTotals.users)})`,
      `Sessions: ${integer(data.totals.sessions)} (${percentChange(data.totals.sessions, data.previousTotals.sessions)})`,
      `Views: ${integer(data.totals.views)} (${percentChange(data.totals.views, data.previousTotals.views)})`,
      ""
    );
  }

  if (sections.includes("events")) {
    const eventLines = Object.entries(eventLabels).map(([eventName, label]) => {
      return `${label}: ${integer(data.events[eventName] || 0)}`;
    });
    const hasTrackedActions = Object.keys(eventLabels).some((eventName) => (data.events[eventName] || 0) > 0);
    lines.push("Actions");
    if (hasTrackedActions) {
      lines.push(...eventLines);
    } else {
      lines.push("No tracked actions yesterday.");
    }
    lines.push("");
  }

  if (sections.includes("countries")) {
    const topCountries = data.topCountries.map(
      (country) => `${displayCountry(country.country)} - ${metricSummary([
        { value: country.users, singular: "user" },
        { value: country.sessions, singular: "session" }
      ])}`
    );
    lines.push("Countries", listSection(topCountries, "No country data yet."), "");
  }

  if (sections.includes("sources")) {
    const topSources = combineSources(data.topSources).map(
      (source) => `${source.label} - ${metricSummary([
        { value: source.sessions, singular: "session" },
        { value: source.users, singular: "user" }
      ])}`
    );
    lines.push("Sources", listSection(topSources, "No source data yet."), "");
  }

  if (sections.includes("pages")) {
    const topPages = data.topPages.map(
      (page) => `${pathLabel(page.path, options.maxPathLength)} - ${metricSummary([
        { value: page.views, singular: "view" },
        { value: page.users, singular: "user" }
      ])}`
    );
    lines.push("Pages", listSection(topPages, "No page data yet."), "");
  }

  if (sections.includes("note")) {
    lines.push("Uses yesterday's completed GA4 data. GA4 may still update recent numbers.");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

module.exports = {
  buildDailySummaryMessage,
  countPhrase,
  defaultEventLabels,
  displayCountry,
  displaySource,
  integer,
  listSection,
  metricSummary,
  pathLabel,
  percentChange,
  yesterdayLabel
};
