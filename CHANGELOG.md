# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning after public release.

## 0.3.5

- Improve Telegram report readability with cleaner headings, singular/plural labels, friendly unknown source/location names, merged source rows, and clearer zero-action summaries.

## 0.3.4

- Document `GA4_MEASUREMENT_ID` as the optional frontend-only measurement ID key.
- Clarify the required backend env vars, optional frontend tracking env var, and optional report display env vars.

## 0.3.3

- Move the existing-site integration prompt higher in the README for faster onboarding.

## 0.3.2

- Add focused SEO guide pages for GA4 Telegram reports, Telegram bot setup, GitHub Actions, Vercel Cron, GA4 service account access, Node.js jobs, npm package setup, and multi-site reporting.
- Expand npm keywords and package description for GA4 Telegram reports, Node.js cron jobs, Vercel, GitHub Actions, Netlify, Railway, and Express.
- Document environment variables with required/optional status, multi-site naming patterns, and the difference between GA4 property IDs and measurement IDs.
- Clarify that the optional browser helper uses a GA4 measurement ID, while backend Telegram reports use the numeric GA4 property ID.
- Add an AI integration prompt and event audit guidance for existing website integrations.
- Clarify fallback behavior for optional `REPORT_SITE_NAME` and `REPORT_TIME_ZONE` values in the AI integration prompt.
- Add Google Analytics Admin API fallback instructions for service account emails rejected by the GA4 UI.
- Add `llms-full.txt` and expand answer-engine context for common GA4 Telegram reporting questions.
- Add static site checks for broken internal links.
- Reduce landing and guide-page hero heading sizes for cleaner desktop and mobile reading.
- Add copy buttons to static site code snippets.
- Add launch copy for GitHub, Hacker News, Reddit, Product Hunt, and social posts.

## 0.3.1

- Update public website, package metadata, and canonical URLs to `analyticsreporter.xyz`.
- Add public contact email.
- Refresh landing-page copy for platform-neutral Node.js reporting.

## 0.3.0

- Add platform-neutral `runDailySummary()` helper.
- Reuse the generic runner from the Vercel adapter.
- Add examples for plain Node cron, GitHub Actions, Express, Netlify Functions, and Railway.
- Document non-Vercel usage paths.

## 0.2.0

- Add `web-analytics-reporter init` CLI.
- Generate a Vercel API route, `vercel.json` cron config, and `.env.example`.
- Update Vercel examples to read GA4 property, site name, and time zone from environment variables.

## 0.1.1

- Point package metadata to the public website.
- Add npm and website links to the README.
- Add a report preview image to the README.
- Add `.env.example` for faster setup.

## 0.1.0

- Initial package structure.
- GA4 daily summary source.
- Telegram report destination.
- Vercel Cron API handler.
- Browser helper for direct GA4 events.
- Multi-site report configuration.
- TypeScript declaration files.
- Node test coverage for core formatting and handler behavior.
