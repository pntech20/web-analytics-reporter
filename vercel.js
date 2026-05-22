const crypto = require("crypto");
const { buildDailySummaryMessage } = require("./core");

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload, null, 2));
}

function headerValue(req, name) {
  const headers = req.headers || {};
  const wanted = name.toLowerCase();
  for (const [headerName, value] of Object.entries(headers)) {
    if (headerName.toLowerCase() === wanted) return value || "";
  }
  return "";
}

function constantTimeEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(req, secret, allowUnauthenticated) {
  if (!secret) return allowUnauthenticated === true;

  const auth = headerValue(req, "authorization");
  if (auth.startsWith("Bearer ") && constantTimeEquals(auth.slice(7), secret)) return true;

  const url = new URL(req.url, "https://example.com");
  return constantTimeEquals(url.searchParams.get("secret"), secret);
}

function normalizeSites(sites) {
  if (!Array.isArray(sites) || !sites.length) throw new Error("createVercelDailySummaryHandler requires at least one site.");
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

function createVercelDailySummaryHandler(options) {
  if (!options) throw new Error("createVercelDailySummaryHandler requires options.");

  const sites = normalizeSites(options.sites);
  const source = options.source;
  const destination = options.destination;
  if (!source || typeof source.dailySummary !== "function") throw new Error("A source with dailySummary(site) is required.");
  if (!destination || typeof destination.send !== "function") throw new Error("A destination with send(report) is required.");

  return async function handler(req, res) {
    if (req.method !== "GET" && req.method !== "POST") {
      return json(res, 405, { ok: false, error: "Method not allowed" });
    }

    if (!options.secret && options.allowUnauthenticated !== true) {
      return json(res, 500, { ok: false, error: "Missing required secret." });
    }

    if (!isAuthorized(req, options.secret, options.allowUnauthenticated)) {
      return json(res, 401, { ok: false, error: "Unauthorized" });
    }

    const url = new URL(req.url, "https://example.com");
    const dryRun = url.searchParams.get("dryRun") === "1";
    const requestedSite = url.searchParams.get("site") || options.defaultSite || "all";
    const sitesToReport = selectedSites(sites, requestedSite);

    if (!sitesToReport.length) {
      return json(res, 404, { ok: false, error: `Unknown site "${requestedSite}".` });
    }

    try {
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

        if (!dryRun) {
          await destination.send({
            chatId: site.telegramChatId || site.chatId,
            siteId: site.id,
            siteName: site.name,
            text
          });
        }

        reports.push({
          dryRun,
          message: text,
          site: site.id,
          totals: data.totals
        });
      }

      const payload = {
        ok: true,
        dryRun,
        reportCount: reports.length,
        reports
      };

      if (reports.length === 1) {
        payload.message = reports[0].message;
        payload.totals = reports[0].totals;
      }

      return json(res, 200, payload);
    } catch (error) {
      return json(res, 500, {
        ok: false,
        error: error.message || "Unknown error"
      });
    }
  };
}

module.exports = {
  constantTimeEquals,
  createVercelDailySummaryHandler,
  headerValue,
  isAuthorized,
  json
};
