const request = require("supertest");
const { createApp } = require("../src/app");

describe("Security headers (Helmet)", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("sets X-Content-Type-Options: nosniff", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("sets X-Frame-Options to block framing", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("sets X-DNS-Prefetch-Control", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
  });
});

describe("Request ID", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("includes X-Request-Id on every response", async () => {
    for (const path of ["/health", "/api/user/preferences", "/leads"]) {
      const res = await request(app).get(path);
      expect(res.headers["x-request-id"]).toBeDefined();
    }
  });

  it("generates a unique ID for every request", async () => {
    const ids = await Promise.all(
      Array.from({ length: 5 }, () => request(app).get("/health").then((r) => r.headers["x-request-id"]))
    );
    const unique = new Set(ids);
    expect(unique.size).toBe(5);
  });
});

describe("404 catch-all", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("returns 404 with ok:false for unknown GET routes", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(typeof res.body.error).toBe("string");
  });

  it("returns 404 for unknown POST routes", async () => {
    const res = await request(app).post("/no-such-endpoint").send({});
    expect(res.status).toBe(404);
  });
});

describe("Request body size limit", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("rejects JSON bodies over 100 kb with 413", async () => {
    const big = "x".repeat(110 * 1024);
    const res = await request(app)
      .post("/api/user/preferences")
      .set("Content-Type", "application/json")
      .send(`{"preferences":{"onlysales_api_key":"${big}"}}`);
    expect(res.status).toBe(413);
  });
});

describe("CORS headers", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("responds to OPTIONS preflight with 204", async () => {
    const res = await request(app).options("/api/user/preferences");
    expect(res.status).toBe(204);
  });

  it("includes Access-Control-Allow-Methods on preflight", async () => {
    const res = await request(app).options("/api/user/preferences");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  it("exposes X-Request-Id in Access-Control-Expose-Headers", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["access-control-expose-headers"]).toContain("X-Request-Id");
  });
});
