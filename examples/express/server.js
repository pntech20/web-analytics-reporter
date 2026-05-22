const express = require("express");
const {
  ga4Source,
  runDailySummary,
  telegramDestination
} = require("web-analytics-reporter");

const app = express();

app.get("/analytics/daily-summary", async (req, res) => {
  if (!process.env.CRON_SECRET || req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const result = await runDailySummary({
      dryRun: req.query.dryRun === "1",
      site: req.query.site || "all",
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

    return res.json(result);
  } catch (error) {
    const status = error.message && error.message.startsWith("Unknown site ") ? 404 : 500;
    return res.status(status).json({ ok: false, error: error.message || "Unknown error" });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Analytics reporter listening on ${port}`);
});
