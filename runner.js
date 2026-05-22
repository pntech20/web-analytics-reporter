const { buildDailySummaryMessage } = require("./core");

function normalizeSites(sites) {
  if (!Array.isArray(sites) || !sites.length) throw new Error("runDailySummary requires at least one site.");
  return sites.map((site) => {
    if (!site.id) throw new Error("Each site needs an id.");
    if (!site.name) throw new Error(`Site "${site.id}" needs a name.`);
    return site;
  });
}

function selectedSites(sites, requestedSite) {
  if (!requestedSite || requestedSite === "all") return sites;
  return sites.filter((site) => site.id === requestedSite);
}

async function runDailySummary(options) {
  if (!options) throw new Error("runDailySummary requires options.");

  const sites = normalizeSites(options.sites);
  const source = options.source;
  const destination = options.destination;
  if (!source || typeof source.dailySummary !== "function") throw new Error("A source with dailySummary(site) is required.");
  if (!destination || typeof destination.send !== "function") throw new Error("A destination with send(report) is required.");

  const requestedSite = options.site || options.defaultSite || "all";
  const sitesToReport = selectedSites(sites, requestedSite);
  if (!sitesToReport.length) throw new Error(`Unknown site "${requestedSite}".`);

  const reports = [];
  for (const site of sitesToReport) {
    const data = await source.dailySummary(site, options.report || {});
    const text = buildDailySummaryMessage({
      data,
      eventLabels: site.eventLabels || options.eventLabels,
      maxPathLength: site.maxPathLength || options.maxPathLength,
      sections: site.sections || options.sections,
      siteName: site.name,
      timeZone: site.timeZone || options.timeZone || "UTC"
    });

    if (!options.dryRun) {
      await destination.send({
        chatId: site.telegramChatId || site.chatId,
        siteId: site.id,
        siteName: site.name,
        text
      });
    }

    reports.push({
      dryRun: options.dryRun === true,
      message: text,
      site: site.id,
      totals: data.totals
    });
  }

  const payload = {
    ok: true,
    dryRun: options.dryRun === true,
    reportCount: reports.length,
    reports
  };

  if (reports.length === 1) {
    payload.message = reports[0].message;
    payload.totals = reports[0].totals;
  }

  return payload;
}

module.exports = {
  normalizeSites,
  runDailySummary,
  selectedSites
};
