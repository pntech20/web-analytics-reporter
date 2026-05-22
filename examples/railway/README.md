# Railway scheduled job

Use `daily-summary.js` as a Railway service command or scheduled job command:

```sh
node examples/railway/daily-summary.js
```

Set the same environment variables from the root `.env.example` file in Railway.

Preview without sending Telegram:

```sh
node examples/railway/daily-summary.js --dry-run
```
