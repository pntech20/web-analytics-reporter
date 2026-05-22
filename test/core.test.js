const assert = require("node:assert/strict");
const test = require("node:test");
const { buildDailySummaryMessage, pathLabel, percentChange } = require("../core");

test("percentChange handles empty baselines", () => {
  assert.equal(percentChange(0, 0), "0%");
  assert.equal(percentChange(5, 0), "new");
  assert.equal(percentChange(12, 10), "+20%");
  assert.equal(percentChange(5, 10), "-50%");
});

test("pathLabel truncates long paths", () => {
  assert.equal(pathLabel("/", 10), "/");
  assert.equal(pathLabel("/short", 10), "/short");
  assert.equal(pathLabel("/this/is/a/long/path", 12), "/this/is/...");
});

test("buildDailySummaryMessage includes configured sections", () => {
  const message = buildDailySummaryMessage({
    siteName: "Example",
    timeZone: "UTC",
    sections: ["traffic", "countries", "events"],
    data: {
      totals: { users: 10, sessions: 12, views: 30, events: 44 },
      previousTotals: { users: 5, sessions: 12, views: 15, events: 22 },
      topCountries: [{ country: "Vietnam", users: 6, sessions: 7 }],
      topPages: [],
      topSources: [],
      events: { signup_clicked: 3 }
    },
    eventLabels: {
      signup_clicked: "Signup clicks"
    }
  });

  assert.match(message, /Example daily summary/);
  assert.match(message, /Users: 10 \(\+100% vs previous day\)/);
  assert.match(message, /Vietnam - 6 users, 7 sessions/);
  assert.match(message, /Signup clicks: 3/);
  assert.doesNotMatch(message, /Top pages/);
});
