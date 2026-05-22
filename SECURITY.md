# Security

Please do not open a public issue for suspected vulnerabilities.

Report security issues by emailing:

```text
contact@analyticsreporter.xyz
```

## Secret Handling

This package expects production secrets to live in your deployment platform:

- `CRON_SECRET`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Do not commit these values to git. If a token or key is exposed, rotate it before using the
project in production.
