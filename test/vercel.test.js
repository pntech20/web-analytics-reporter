const assert = require("node:assert/strict");
const test = require("node:test");
const { constantTimeEquals, createVercelDailySummaryHandler, isAuthorized } = require("../vercel");

function createResponse() {
  const chunks = [];
  return {
    res: {
      statusCode: 0,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      end(chunk) {
        chunks.push(chunk);
      }
    },
    body() {
      return JSON.parse(chunks.join(""));
    }
  };
}

const fakeData = {
  totals: { users: 1, sessions: 1, views: 2, events: 3 },
  previousTotals: { users: 0, sessions: 0, views: 1, events: 1 },
  topCountries: [],
  topPages: [],
  topSources: [],
  events: {}
};

test("handler requires a secret by default", async () => {
  const handler = createVercelDailySummaryHandler({
    source: { dailySummary: async () => fakeData },
    destination: { send: async () => ({ ok: true }) },
    sites: [{ id: "demo", name: "Demo" }]
  });
  const { res, body } = createResponse();

  await handler({ method: "GET", url: "/api/report", headers: {} }, res);

  assert.equal(res.statusCode, 500);
  assert.equal(body().error, "Missing required secret.");
});

test("authorization accepts bearer token and rejects wrong secrets", () => {
  assert.equal(constantTimeEquals("secret", "secret"), true);
  assert.equal(constantTimeEquals("secret", "wrong"), false);
  assert.equal(
    isAuthorized({ method: "GET", url: "/api/report", headers: { Authorization: "Bearer secret" } }, "secret"),
    true
  );
  assert.equal(
    isAuthorized({ method: "GET", url: "/api/report?secret=wrong", headers: {} }, "secret"),
    false
  );
});

test("handler returns dry-run report without sending", async () => {
  let sends = 0;
  const handler = createVercelDailySummaryHandler({
    secret: "secret",
    source: { dailySummary: async () => fakeData },
    destination: { send: async () => { sends += 1; } },
    sites: [{ id: "demo", name: "Demo", telegramChatId: "123" }]
  });
  const { res, body } = createResponse();

  await handler({ method: "GET", url: "/api/report?secret=secret&dryRun=1&site=demo", headers: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(body().ok, true);
  assert.equal(body().dryRun, true);
  assert.equal(body().reportCount, 1);
  assert.equal(typeof body().message, "string");
  assert.equal(sends, 0);
});

test("handler can report all configured sites", async () => {
  const sent = [];
  const handler = createVercelDailySummaryHandler({
    secret: "secret",
    source: { dailySummary: async () => fakeData },
    destination: { send: async (report) => sent.push(report.siteId) },
    sites: [
      { id: "one", name: "One", telegramChatId: "123" },
      { id: "two", name: "Two", telegramChatId: "123" }
    ]
  });
  const { res, body } = createResponse();

  await handler({ method: "GET", url: "/api/report?secret=secret&site=all", headers: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(body().reportCount, 2);
  assert.deepEqual(sent, ["one", "two"]);
});
