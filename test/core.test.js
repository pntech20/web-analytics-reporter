const assert = require("node:assert/strict");
const test = require("node:test");
const { buildDailySummaryMessage, displaySource, pathLabel, percentChange } = require("../core");

test("percentChange handles empty baselines", () => {
  assert.equal(percentChange(0, 0), "no change");
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
      topCountries: [
        { country: "Vietnam", users: 6, sessions: 7 },
        { country: "(not set)", users: 1, sessions: 1 }
      ],
      topPages: [],
      topSources: [],
      events: { signup_clicked: 3 }
    },
    eventLabels: {
      signup_clicked: "Signup clicks"
    }
  });

  assert.match(message, /Example daily summary/);
  assert.match(message, /Users: 10 \(\+100%\)/);
  assert.match(message, /Vietnam - 6 users, 7 sessions/);
  assert.match(message, /Unknown location - 1 user, 1 session/);
  assert.match(message, /Signup clicks: 3/);
  assert.doesNotMatch(message, /Top pages/);
});

test("buildDailySummaryMessage formats low-volume reports clearly", () => {
  const message = buildDailySummaryMessage({
    siteName: "DevClean",
    timeZone: "UTC",
    data: {
      totals: { users: 6, sessions: 6, views: 7, events: 3 },
      previousTotals: { users: 5, sessions: 5, views: 5, events: 0 },
      topCountries: [
        { country: "China", users: 1, sessions: 1 },
        { country: "Vietnam", users: 0, sessions: 1 }
      ],
      topSources: [
        { source: "(direct) / (none)", sessions: 3, users: 3 },
        { source: "perplexity / (none)", sessions: 1, users: 1 },
        { source: "perplexity / (not set)", sessions: 1, users: 1 },
        { source: "(not set)", sessions: 1, users: 0 }
      ],
      topPages: [
        { path: "/", views: 5, users: 5 },
        { path: "/guide", views: 1, users: 1 }
      ],
      events: { download_clicked: 1, guide_clicked: 2 }
    }
  });

  assert.match(message, /DevClean daily summary\n/);
  assert.match(message, /Actions\nDownloads: 1\nGuide clicks: 2\nSupport clicks: 0/);
  assert.match(message, /Vietnam - 1 session/);
  assert.match(message, /Direct - 3 sessions, 3 users/);
  assert.match(message, /Perplexity - 2 sessions, 2 users/);
  assert.match(message, /Unknown source - 1 session/);
  assert.match(message, /\/guide - 1 view, 1 user/);
  assert.doesNotMatch(message, /\(not set\)/);
  assert.doesNotMatch(message, /1 users/);
  assert.doesNotMatch(message, /1 sessions/);
});

test("buildDailySummaryMessage summarizes zero actions", () => {
  const message = buildDailySummaryMessage({
    siteName: "Empty",
    timeZone: "UTC",
    sections: ["traffic", "events"],
    data: {
      totals: { users: 0, sessions: 0, views: 0, events: 0 },
      previousTotals: { users: 0, sessions: 0, views: 0, events: 0 },
      topCountries: [],
      topPages: [],
      topSources: [],
      events: {}
    }
  });

  assert.match(message, /Users: 0 \(no change\)/);
  assert.match(message, /No tracked actions yesterday/);
  assert.doesNotMatch(message, /Downloads: 0/);
});

test("displaySource makes common GA4 source labels readable", () => {
  assert.equal(displaySource("(direct) / (none)"), "Direct");
  assert.equal(displaySource("(not set)"), "Unknown source");
  assert.equal(displaySource("google / organic"), "Google Organic");
  assert.equal(displaySource("chatgpt.com / (not set)"), "ChatGPT");
  assert.equal(displaySource("perplexity / (none)"), "Perplexity");
});
