const {
  ga4Source,
  runDailySummary,
  telegramDestination
} = require("web-analytics-reporter");

async function main() {
  const result = await runDailySummary({
    dryRun: process.argv.includes("--dry-run"),
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

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
