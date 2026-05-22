const {
  createVercelDailySummaryHandler,
  ga4Source,
  telegramDestination
} = require("web-analytics-reporter");

module.exports = createVercelDailySummaryHandler({
  secret: process.env.CRON_SECRET,
  source: ga4Source({
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY
  }),
  destination: telegramDestination({
    botToken: process.env.TELEGRAM_BOT_TOKEN
  }),
  timeZone: "UTC",
  sites: [
    {
      id: "example",
      name: "Example Site",
      ga4PropertyId: "123456789",
      telegramChatId: process.env.TELEGRAM_CHAT_ID
    }
  ]
});
