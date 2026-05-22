const crypto = require("crypto");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(privateKey) {
  return privateKey.replace(/\\n/g, "\n");
}

function createServiceAccountJwt(options) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const claimSet = {
    iss: options.clientEmail,
    scope: GA4_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claimSet))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(normalizePrivateKey(options.privateKey));

  return `${unsigned}.${base64Url(signature)}`;
}

async function getGoogleAccessToken(options) {
  if (!options || !options.clientEmail || !options.privateKey) {
    throw new Error("Google access token requires clientEmail and privateKey.");
  }

  const assertion = createServiceAccountJwt({
    clientEmail: options.clientEmail,
    privateKey: options.privateKey
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Google token request failed: ${body.error || response.status}`);
  }

  return body.access_token;
}

async function runGa4Report(options) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${options.propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${options.accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(options.body)
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    const message = payload.error && payload.error.message ? payload.error.message : response.status;
    throw new Error(`GA4 report failed: ${message}`);
  }

  return payload;
}

function metricValue(report, index) {
  const value = report.rows && report.rows[0] && report.rows[0].metricValues[index];
  return value ? Number(value.value || 0) : 0;
}

function rows(report) {
  return report.rows || [];
}

function metric(row, index) {
  const value = row.metricValues && row.metricValues[index];
  return value ? Number(value.value || 0) : 0;
}

function dimension(row, index) {
  const value = row.dimensionValues && row.dimensionValues[index];
  return value ? value.value || "" : "";
}

function defaultEventNames() {
  return ["download_clicked", "guide_clicked", "support_clicked", "external_link_clicked"];
}

function ga4Source(options) {
  if (!options) throw new Error("ga4Source requires options.");

  async function accessToken() {
    return getGoogleAccessToken({
      clientEmail: options.clientEmail,
      privateKey: options.privateKey
    });
  }

  async function dailySummary(site, reportOptions) {
    const propertyId = site.ga4PropertyId || site.propertyId || options.propertyId;
    if (!propertyId) throw new Error(`Missing GA4 property ID for site "${site.id || site.name}".`);
    if (!options.clientEmail || !options.privateKey) {
      throw new Error("Missing GA4 clientEmail or privateKey.");
    }

    const token = await accessToken();
    return fetchGa4DailySummary({
      accessToken: token,
      propertyId,
      eventNames: (reportOptions && reportOptions.eventNames) || site.eventNames || options.eventNames,
      limits: (reportOptions && reportOptions.limits) || site.limits || options.limits
    });
  }

  return {
    dailySummary,
    getAccessToken: accessToken,
    type: "ga4"
  };
}

async function fetchGa4DailySummary(options) {
  const limits = Object.assign({ pages: 5, sources: 5, countries: 5, events: 50 }, options.limits || {});
  const eventNames = options.eventNames || defaultEventNames();
  const accessToken = options.accessToken;
  const propertyId = options.propertyId;

  const [totalsYesterday, totalsPrevious, topPages, topSources, topCountries, events] = await Promise.all([
    runGa4Report({
      accessToken,
      propertyId,
      body: {
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "eventCount" }
        ]
      }
    }),
    runGa4Report({
      accessToken,
      propertyId,
      body: {
        dateRanges: [{ startDate: "2daysAgo", endDate: "2daysAgo" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "eventCount" }
        ]
      }
    }),
    runGa4Report({
      accessToken,
      propertyId,
      body: {
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: String(limits.pages)
      }
    }),
    runGa4Report({
      accessToken,
      propertyId,
      body: {
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: String(limits.sources)
      }
    }),
    runGa4Report({
      accessToken,
      propertyId,
      body: {
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: String(limits.countries)
      }
    }),
    runGa4Report({
      accessToken,
      propertyId,
      body: {
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: String(limits.events)
      }
    })
  ]);

  const eventCounts = rows(events).reduce((result, row) => {
    result[dimension(row, 0)] = metric(row, 0);
    return result;
  }, {});
  for (const eventName of eventNames) {
    if (!Object.prototype.hasOwnProperty.call(eventCounts, eventName)) eventCounts[eventName] = 0;
  }

  return {
    totals: {
      users: metricValue(totalsYesterday, 0),
      sessions: metricValue(totalsYesterday, 1),
      views: metricValue(totalsYesterday, 2),
      events: metricValue(totalsYesterday, 3)
    },
    previousTotals: {
      users: metricValue(totalsPrevious, 0),
      sessions: metricValue(totalsPrevious, 1),
      views: metricValue(totalsPrevious, 2),
      events: metricValue(totalsPrevious, 3)
    },
    topPages: rows(topPages).map((row) => ({
      path: dimension(row, 0),
      views: metric(row, 0),
      users: metric(row, 1)
    })),
    topSources: rows(topSources).map((row) => ({
      source: dimension(row, 0),
      sessions: metric(row, 0),
      users: metric(row, 1)
    })),
    topCountries: rows(topCountries).map((row) => ({
      country: dimension(row, 0),
      users: metric(row, 0),
      sessions: metric(row, 1)
    })),
    events: eventCounts
  };
}

module.exports = {
  createServiceAccountJwt,
  defaultEventNames,
  fetchGa4DailySummary,
  ga4Source,
  getGoogleAccessToken,
  normalizePrivateKey,
  runGa4Report
};
