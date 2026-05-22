# Web Analytics Reporter

[![CI](https://github.com/pntech20/web-analytics-reporter/actions/workflows/ci.yml/badge.svg)](https://github.com/pntech20/web-analytics-reporter/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/web-analytics-reporter.svg)](https://www.npmjs.com/package/web-analytics-reporter)
[![npm downloads](https://img.shields.io/npm/dm/web-analytics-reporter.svg)](https://www.npmjs.com/package/web-analytics-reporter)

[Website](https://analyticsreporter.xyz/) · [npm](https://www.npmjs.com/package/web-analytics-reporter) · [GitHub](https://github.com/pntech20/web-analytics-reporter) · [Answers](https://analyticsreporter.xyz/answers)

Reusable GA4 analytics reports for Telegram, Node.js cron jobs, and multi-site website monitoring.

Use Web Analytics Reporter when you want a daily website summary in Telegram without opening
Google Analytics every morning. It is small, dependency-free, and designed to be embedded in
Node.js cron jobs, serverless functions, and scheduled workflows.

Contact: [contact@analyticsreporter.xyz](mailto:contact@analyticsreporter.xyz)

![Example Telegram-style daily analytics report with users, sessions, countries, sources, pages, and events](https://analyticsreporter.xyz/assets/report-preview.svg)

## Features

- GA4 daily summaries with users, sessions, page views, countries, sources, pages, and custom events.
- Telegram delivery with one chat per site or a shared reporting chat.
- Platform-neutral runner plus Vercel Cron handler for scheduled reports.
- Examples for plain Node cron, GitHub Actions, Express, Netlify Functions, Railway, and Vercel.
- Multi-site configuration from one API endpoint.
- Browser helper for direct GA4 event tracking.
- TypeScript declarations for every public entry point.
- Secure-by-default cron authorization with `CRON_SECRET`.
- No runtime npm dependencies.

## Guides

- [GA4 Telegram report setup](https://analyticsreporter.xyz/ga4-telegram-report)
- [Google Analytics Telegram bot](https://analyticsreporter.xyz/google-analytics-telegram-bot)
- [GA4 report from GitHub Actions](https://analyticsreporter.xyz/ga4-github-actions-report)
- [GA4 report from Vercel Cron](https://analyticsreporter.xyz/ga4-vercel-cron-report)
- [Multi-site GA4 reporting](https://analyticsreporter.xyz/ga4-multi-site-reporting)

## Install

```sh
npm install web-analytics-reporter
```

Requirements:

- Node.js 18 or later.
- A GA4 property.
- A Google service account with Viewer access to that GA4 property.
- A Telegram bot and chat ID.

## Quick Start

The fastest setup path is the CLI initializer:

```sh
npx web-analytics-reporter init
```

It creates:

- `api/daily-summary.js`
- `vercel.json`
- `.env.example`

Then fill the generated environment variables in Vercel and preview the report:

```text
https://example.com/api/daily-summary?secret=<CRON_SECRET>&dryRun=1
```

### Manual Setup

Create `api/daily-summary.js` in a Vercel project:

```js
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
  timeZone: process.env.REPORT_TIME_ZONE || "UTC",
  sites: [
    {
      id: process.env.REPORT_SITE_ID || "marketing",
      name: process.env.REPORT_SITE_NAME || "Marketing Site",
      ga4PropertyId: process.env.GA4_PROPERTY_ID,
      telegramChatId: process.env.TELEGRAM_CHAT_ID
    }
  ]
});
```

Add `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/daily-summary",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Test without sending a Telegram message:

```text
https://example.com/api/daily-summary?secret=<CRON_SECRET>&dryRun=1
```

Send a real report:

```text
https://example.com/api/daily-summary?secret=<CRON_SECRET>
```

You can also authorize with an HTTP header:

```text
Authorization: Bearer <CRON_SECRET>
```

## Environment Variables

Copy `.env.example` and fill in your real values:

```text
CRON_SECRET=
GA4_PROPERTY_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
REPORT_SITE_ID=
REPORT_SITE_NAME=
REPORT_TIME_ZONE=
```

Never commit these values. Store them in your deployment platform.

You can create the starter files at any time:

```sh
npx web-analytics-reporter init --site-name "Marketing Site" --time-zone UTC
```

## GA4 Setup

1. Enable the Google Analytics Data API in Google Cloud.
2. Create a service account.
3. Create a JSON key for that service account.
4. Add the service account email as Viewer in the GA4 property.
5. Store the service account email in `GOOGLE_CLIENT_EMAIL`.
6. Store the private key in `GOOGLE_PRIVATE_KEY`.

If your private key is stored in an environment variable with escaped newlines, the package
normalizes `\n` automatically.

### If GA4 rejects the service account email

Some Google Analytics UI screens only accept regular Google Account emails and may reject
service account addresses such as:

```text
ga4-report-reader@your-project.iam.gserviceaccount.com
```

Before changing the key, confirm you are granting access to the correct GA4 property.
Use the numeric property ID from the target website, not another property in the same
account.

If the UI still rejects the email, add the service account with the Google Analytics
Admin API instead:

1. Open `properties.accessBindings.create` in the Google Analytics Admin API explorer.
2. Set `parent` to your property, for example:

```text
properties/123456789
```

3. Use this request body:

```json
{
  "user": "ga4-report-reader@your-project.iam.gserviceaccount.com",
  "roles": [
    "predefinedRoles/viewer"
  ]
}
```

4. Execute the request while signed in with a Google account that has Administrator
   access to that GA4 property.

After the request succeeds, the service account can read reports for that property with
Viewer access.

## Multiple Sites

Configure multiple sites in one handler or runner call:

```js
sites: [
  {
    id: "marketing",
    name: "Marketing Site",
    ga4PropertyId: "111111111",
    telegramChatId: process.env.TELEGRAM_CHAT_ID
  },
  {
    id: "docs",
    name: "Docs",
    ga4PropertyId: "222222222",
    telegramChatId: process.env.DOCS_TELEGRAM_CHAT_ID
  }
]
```

Report one site:

```text
/api/daily-summary?site=marketing&secret=<CRON_SECRET>
```

Report every configured site:

```text
/api/daily-summary?site=all&secret=<CRON_SECRET>
```

## Non-Vercel Usage

Vercel is only one adapter. For any Node.js runtime, call `runDailySummary()` directly:

```js
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
  console.error(error);
  process.exit(1);
});
```

Schedule that script with the platform you already use:

- Plain Node cron: `examples/node/daily-summary.js`
- GitHub Actions schedule: `examples/github-actions/daily-summary.yml`
- Express route: `examples/express/server.js`
- Netlify Function: `examples/netlify/functions/daily-summary.js`
- Railway scheduled job: `examples/railway/daily-summary.js`
- Vercel Cron: `examples/vercel/daily-summary.js`

## Custom Events

Default event labels:

- `download_clicked`
- `guide_clicked`
- `support_clicked`
- `external_link_clicked`

Override them globally:

```js
eventLabels: {
  signup_clicked: "Signup clicks",
  checkout_started: "Checkout starts"
}
```

Or per site:

```js
{
  id: "app",
  name: "App",
  ga4PropertyId: "123456789",
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  eventLabels: {
    signup_clicked: "Signup clicks"
  }
}
```

## Browser GA4 Helper

The browser helper is optional. You can use your own frontend tracking and only use this
package for scheduled reports.

```html
<script src="/vendor/web-analytics-reporter/browser.js"></script>
<script>
  WebAnalyticsReporter.initGA4("G-XXXXXXXXXX");
  WebAnalyticsReporter.installLinkEventTracking({
    resolveEventName: function (context) {
      if (context.url.pathname.indexOf("/downloads/") === 0) return "download_clicked";
      if (context.url.pathname.indexOf("/guides/") === 0) return "guide_clicked";
      return null;
    }
  });
</script>
```

## API

```js
const {
  buildDailySummaryMessage,
  createVercelDailySummaryHandler,
  ga4Source,
  runDailySummary,
  telegramDestination
} = require("web-analytics-reporter");
```

Subpath exports:

```js
require("web-analytics-reporter/core");
require("web-analytics-reporter/ga4");
require("web-analytics-reporter/runner");
require("web-analytics-reporter/telegram");
require("web-analytics-reporter/vercel");
require("web-analytics-reporter/browser");
```

## Security

- The Vercel handler requires `CRON_SECRET` by default.
- Use a long random secret.
- Prefer `Authorization: Bearer <CRON_SECRET>` for manual calls.
- Keep Google service account keys and Telegram tokens out of source control.
- Grant the service account Viewer access only to the GA4 properties it needs.
- Rotate any leaked service account key or Telegram bot token immediately.
- Use `dryRun=1` to verify reports before sending messages.

## Development

```sh
npm test
npm run check
npm run site:check
npm run pack:check
```

The package is build-free CommonJS for now. That keeps deployment simple in Node.js cron
jobs, Vercel API functions, and other serverless runtimes.

## Roadmap

- Slack destination.
- Email destination.
- Discord destination.
- Generic webhook destination.
- PostHog source.
- Plausible source.
- Next.js route handler adapter.
- Cloudflare Workers adapter.

## License

MIT
