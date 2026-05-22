const crypto = require("crypto");
const { normalizeSites, runDailySummary } = require("./runner");

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

function createVercelDailySummaryHandler(options) {
  if (!options) throw new Error("createVercelDailySummaryHandler requires options.");
  normalizeSites(options.sites);
  if (!options.source || typeof options.source.dailySummary !== "function") {
    throw new Error("A source with dailySummary(site) is required.");
  }
  if (!options.destination || typeof options.destination.send !== "function") {
    throw new Error("A destination with send(report) is required.");
  }

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

    try {
      return json(res, 200, await runDailySummary({ ...options, dryRun, site: requestedSite }));
    } catch (error) {
      const statusCode = error.message && error.message.startsWith("Unknown site ") ? 404 : 500;
      return json(res, statusCode, {
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
  json,
  normalizeSites,
  runDailySummary
};
