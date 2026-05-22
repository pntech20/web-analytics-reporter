const fs = require("fs");
const path = require("path");
const pkg = require("./package.json");

const DEFAULTS = {
  api: "api/daily-summary.js",
  schedule: "0 8 * * *",
  siteId: "example",
  siteName: "Example Site",
  timeZone: "UTC"
};

const ENV_KEYS = [
  "CRON_SECRET",
  "GA4_PROPERTY_ID",
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "REPORT_SITE_ID",
  "REPORT_SITE_NAME",
  "REPORT_TIME_ZONE"
];

function usage() {
  return `Web Analytics Reporter ${pkg.version}

Usage:
  web-analytics-reporter init [options]
  web-analytics-reporter --help
  web-analytics-reporter --version

Options:
  --dir <path>              Project directory. Defaults to the current directory.
  --api <path>              API file to create. Default: ${DEFAULTS.api}
  --schedule <cron>         Vercel Cron schedule. Default: "${DEFAULTS.schedule}"
  --site-id <id>            Site id used by ?site=. Default: ${DEFAULTS.siteId}
  --site-name <name>        Human-readable site name. Default: "${DEFAULTS.siteName}"
  --time-zone <zone>        Report time zone. Default: ${DEFAULTS.timeZone}
  --force                   Overwrite generated files when they already exist.

Examples:
  npx web-analytics-reporter init
  npx web-analytics-reporter init --site-name "DevClean" --time-zone Asia/Ho_Chi_Minh
`;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function parseArgs(argv) {
  const result = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }

    const [rawName, inlineValue] = arg.slice(2).split(/=(.*)/s, 2);
    const name = toCamelCase(rawName);

    if (name === "help" || name === "version" || name === "force") {
      result[name] = true;
      continue;
    }

    const value = inlineValue !== undefined ? inlineValue : argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${rawName}.`);
    }

    result[name] = value;
    if (inlineValue === undefined) index += 1;
  }

  return result;
}

function routeFromApiPath(apiPath) {
  const withoutExtension = apiPath.replace(/\.[cm]?js$/, "");
  const normalized = withoutExtension.split(path.sep).join("/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function relativePath(targetDir, filePath) {
  return path.relative(targetDir, filePath).split(path.sep).join("/");
}

function createApiTemplate(options) {
  return `const {
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
  timeZone: process.env.REPORT_TIME_ZONE || ${JSON.stringify(options.timeZone)},
  sites: [
    {
      id: process.env.REPORT_SITE_ID || ${JSON.stringify(options.siteId)},
      name: process.env.REPORT_SITE_NAME || ${JSON.stringify(options.siteName)},
      ga4PropertyId: process.env.GA4_PROPERTY_ID,
      telegramChatId: process.env.TELEGRAM_CHAT_ID
    }
  ]
});
`;
}

function createEnvExample(options) {
  return `# Web Analytics Reporter

# Use a long random value. Vercel Cron and manual requests must send this secret.
CRON_SECRET=replace-with-a-long-random-secret

# Google Analytics 4 property ID, not the measurement ID.
GA4_PROPERTY_ID=123456789

# Google service account with Viewer access to the GA4 property.
GOOGLE_CLIENT_EMAIL=ga4-report-reader@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nreplace-with-private-key\\n-----END PRIVATE KEY-----\\n"

# Telegram bot destination.
TELEGRAM_BOT_TOKEN=123456789:replace-with-bot-token
TELEGRAM_CHAT_ID=123456789

# Report display settings.
REPORT_SITE_ID=${options.siteId}
REPORT_SITE_NAME=${options.siteName}
REPORT_TIME_ZONE=${options.timeZone}
`;
}

function writeFileIfNeeded(filePath, contents, force, actions) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (fs.existsSync(filePath) && !force) {
    actions.push({ type: "skipped", filePath });
    return;
  }

  fs.writeFileSync(filePath, contents);
  actions.push({ type: fs.existsSync(filePath) && force ? "updated" : "created", filePath });
}

function upsertEnvExample(targetDir, options, force, actions) {
  const filePath = path.join(targetDir, ".env.example");
  if (!fs.existsSync(filePath) || force) {
    writeFileIfNeeded(filePath, createEnvExample(options), force, actions);
    return;
  }

  const existing = fs.readFileSync(filePath, "utf8");
  const missing = ENV_KEYS.filter((key) => !new RegExp(`^${key}=`, "m").test(existing));
  if (!missing.length) {
    actions.push({ type: "skipped", filePath });
    return;
  }

  const additions = missing.map((key) => `${key}=`).join("\n");
  fs.writeFileSync(filePath, `${existing.trimEnd()}\n\n# Web Analytics Reporter\n${additions}\n`);
  actions.push({ type: "updated", filePath });
}

function upsertVercelJson(targetDir, routePath, schedule, actions) {
  const filePath = path.join(targetDir, "vercel.json");
  const cron = { path: routePath, schedule };

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${JSON.stringify({ crons: [cron] }, null, 2)}\n`);
    actions.push({ type: "created", filePath });
    return;
  }

  const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const crons = Array.isArray(existing.crons) ? existing.crons : [];
  const alreadyExists = crons.some((item) => item && item.path === routePath);
  if (alreadyExists) {
    actions.push({ type: "skipped", filePath });
    return;
  }

  existing.crons = [...crons, cron];
  fs.writeFileSync(filePath, `${JSON.stringify(existing, null, 2)}\n`);
  actions.push({ type: "updated", filePath });
}

function initProject(rawOptions = {}) {
  const options = {
    ...DEFAULTS,
    ...rawOptions
  };
  const targetDir = path.resolve(options.dir || process.cwd());
  const apiFile = path.resolve(targetDir, options.api);
  const routePath = routeFromApiPath(path.relative(targetDir, apiFile));
  const actions = [];

  if (!fs.existsSync(targetDir)) {
    throw new Error(`Project directory does not exist: ${targetDir}`);
  }

  writeFileIfNeeded(apiFile, createApiTemplate(options), options.force, actions);
  upsertVercelJson(targetDir, routePath, options.schedule, actions);
  upsertEnvExample(targetDir, options, options.force, actions);

  return {
    actions,
    routePath,
    targetDir
  };
}

function formatResult(result) {
  const lines = ["Web Analytics Reporter initialized.", ""];

  for (const action of result.actions) {
    lines.push(`${action.type.padEnd(7)} ${relativePath(result.targetDir, action.filePath)}`);
  }

  lines.push("");
  lines.push("Next steps:");
  lines.push("1. Copy .env.example values into your deployment environment.");
  lines.push(`2. Open ${result.routePath}?secret=<CRON_SECRET>&dryRun=1 to preview the report.`);
  lines.push("3. Remove dryRun=1 when the report looks correct.");

  return lines.join("\n");
}

async function main(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout || process.stdout;
  const args = parseArgs(argv);
  const command = args._[0];

  if (args.version) {
    stdout.write(`${pkg.version}\n`);
    return;
  }

  if (args.help || !command) {
    stdout.write(usage());
    return;
  }

  if (command !== "init") {
    throw new Error(`Unknown command "${command}". Run web-analytics-reporter --help.`);
  }

  const result = initProject(args);
  stdout.write(`${formatResult(result)}\n`);
}

module.exports = {
  createApiTemplate,
  createEnvExample,
  formatResult,
  initProject,
  main,
  parseArgs,
  routeFromApiPath,
  usage
};
