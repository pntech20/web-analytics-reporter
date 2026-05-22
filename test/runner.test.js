const assert = require("node:assert/strict");
const test = require("node:test");
const { normalizeSites, runDailySummary, selectedSites } = require("../runner");

const fakeData = {
  totals: { users: 5, sessions: 6, views: 7, events: 8 },
  previousTotals: { users: 4, sessions: 3, views: 2, events: 1 },
  topCountries: [],
  topPages: [],
  topSources: [],
  events: {}
};

test("normalizeSites requires at least one valid site", () => {
  assert.throws(() => normalizeSites([]), /at least one site/);
  assert.throws(() => normalizeSites([{ name: "No id" }]), /needs an id/);
  assert.throws(() => normalizeSites([{ id: "missing-name" }]), /needs a name/);
});

test("selectedSites returns all sites by default", () => {
  const sites = [
    { id: "one", name: "One" },
    { id: "two", name: "Two" }
  ];

  assert.equal(selectedSites(sites).length, 2);
  assert.deepEqual(selectedSites(sites, "two"), [{ id: "two", name: "Two" }]);
});

test("runDailySummary formats and sends selected reports", async () => {
  const sent = [];
  const result = await runDailySummary({
    site: "docs",
    source: { dailySummary: async () => fakeData },
    destination: { send: async (report) => sent.push(report) },
    sites: [
      { id: "marketing", name: "Marketing", telegramChatId: "111" },
      { id: "docs", name: "Docs", telegramChatId: "222" }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.reportCount, 1);
  assert.equal(result.reports[0].site, "docs");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].chatId, "222");
  assert.match(sent[0].text, /Docs daily summary/);
});

test("runDailySummary dry run does not send", async () => {
  let sends = 0;
  const result = await runDailySummary({
    dryRun: true,
    source: { dailySummary: async () => fakeData },
    destination: { send: async () => { sends += 1; } },
    sites: [{ id: "demo", name: "Demo", telegramChatId: "123" }]
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.message, result.reports[0].message);
  assert.equal(sends, 0);
});
