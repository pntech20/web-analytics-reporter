const {
  ga4Source,
  runDailySummary,
  telegramDestination
} = require("web-analytics-reporter");

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload, null, 2)
  };
}

exports.handler = async function dailySummary(event) {
  const query = event.queryStringParameters || {};
  const auth = event.headers.authorization || event.headers.Authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const providedSecret = bearer || query.secret;

  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  try {
    const result = await runDailySummary({
      dryRun: query.dryRun === "1",
      site: query.site || "all",
      source: ga4Source({
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY
      }),
      destination: telegramDestination({
        botToken: process.env.TELEGRAM_BOT_TOKEN
      }),
      timeZone: process.env.REPORT_TIME_ZONE || "UTC",
      sites: [
        {
          id: process.env.REPORT_SITE_ID || "default",
          name: process.env.REPORT_SITE_NAME || "Website",
          ga4PropertyId: process.env.GA4_PROPERTY_ID,
          telegramChatId: process.env.TELEGRAM_CHAT_ID
        }
      ]
    });

    return json(200, result);
  } catch (error) {
    const status = error.message && error.message.startsWith("Unknown site ") ? 404 : 500;
    return json(status, { ok: false, error: error.message || "Unknown error" });
  }
};
