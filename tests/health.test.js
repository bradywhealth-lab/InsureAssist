const request = require("supertest");
const { createApp } = require("../src/app");

describe("GET /health", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("returns 200 with ok:true", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("includes a timestamp", async () => {
    const res = await request(app).get("/health");
    expect(typeof res.body.timestamp).toBe("string");
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });

  it("sets X-Request-Id header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("generates a unique X-Request-Id per request", async () => {
    const [r1, r2] = await Promise.all([
      request(app).get("/health"),
      request(app).get("/health"),
    ]);
    expect(r1.headers["x-request-id"]).not.toBe(r2.headers["x-request-id"]);
  });
});
