const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { initProject, parseArgs, routeFromApiPath } = require("../cli");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "web-analytics-reporter-"));
}

test("parseArgs reads init options", () => {
  const args = parseArgs([
    "init",
    "--site-name",
    "DevClean",
    "--time-zone=Asia/Ho_Chi_Minh",
    "--force"
  ]);

  assert.equal(args._[0], "init");
  assert.equal(args.siteName, "DevClean");
  assert.equal(args.timeZone, "Asia/Ho_Chi_Minh");
  assert.equal(args.force, true);
});

test("routeFromApiPath converts API files into Vercel routes", () => {
  assert.equal(routeFromApiPath("api/daily-summary.js"), "/api/daily-summary");
  assert.equal(routeFromApiPath("api/report.mjs"), "/api/report");
});

test("initProject creates Vercel starter files", () => {
  const dir = tempProject();

  const result = initProject({
    dir,
    siteName: "DevClean",
    timeZone: "Asia/Ho_Chi_Minh"
  });

  assert.equal(result.routePath, "/api/daily-summary");
  assert.equal(fs.existsSync(path.join(dir, "api/daily-summary.js")), true);
  assert.equal(fs.existsSync(path.join(dir, "vercel.json")), true);
  assert.equal(fs.existsSync(path.join(dir, ".env.example")), true);

  const api = fs.readFileSync(path.join(dir, "api/daily-summary.js"), "utf8");
  assert.match(api, /process\.env\.GA4_PROPERTY_ID/);
  assert.match(api, /DevClean/);

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(dir, "vercel.json"), "utf8"));
  assert.deepEqual(vercelConfig.crons, [{ path: "/api/daily-summary", schedule: "0 8 * * *" }]);
});

test("initProject merges existing Vercel cron config", () => {
  const dir = tempProject();
  fs.writeFileSync(
    path.join(dir, "vercel.json"),
    `${JSON.stringify({ crons: [{ path: "/api/old", schedule: "0 0 * * *" }] }, null, 2)}\n`
  );

  initProject({ dir, api: "api/report.js", schedule: "0 9 * * *" });

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(dir, "vercel.json"), "utf8"));
  assert.deepEqual(vercelConfig.crons, [
    { path: "/api/old", schedule: "0 0 * * *" },
    { path: "/api/report", schedule: "0 9 * * *" }
  ]);
});
