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

describe("Cache-Control", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("sets Cache-Control: no-store on all API responses", async () => {
    for (const path of ["/health", "/api/user/preferences", "/leads"]) {
      const res = await request(app).get(path);
      expect(res.headers["cache-control"]).toBe("no-store");
    }
  });

  it("sets Pragma: no-cache on all API responses", async () => {
    const res = await request(app).get("/api/user/preferences");
    expect(res.headers["pragma"]).toBe("no-cache");
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

  it("sanitizes special characters from the path in error messages", async () => {
    const res = await request(app).get("/<script>alert(1)</script>");
    expect(res.status).toBe(404);
    // The reflected path should NOT contain angle brackets or parens
    expect(res.body.error).not.toMatch(/[<>()]/);
  });

  it("truncates very long paths in error messages", async () => {
    const longPath = "/" + "a".repeat(200);
    const res = await request(app).get(longPath);
    expect(res.status).toBe(404);
    // Path in error should be capped at 100 chars
    expect(res.body.error.length).toBeLessThan(200);
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

describe("Auth token endpoint security", () => {
  it("never leaks the real API_KEY in token response", async () => {
    process.env.API_KEY = "super-secret-production-key";
    const app = createApp();
    const res = await request(app)
      .post("/api/auth/token")
      .send({ username: "admin", password: "pass" });
    expect(res.status).toBe(200);
    expect(res.body.token).not.toBe("super-secret-production-key");
    expect(res.body.token).not.toContain("super-secret");
  });
});

describe("PII protection on public endpoints", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("does not expose email or phone on /leads", async () => {
    const res = await request(app).get("/leads?limit=10");
    for (const lead of res.body.data) {
      expect(lead.email).toBeUndefined();
      expect(lead.phone).toBeUndefined();
    }
  });

  it("does not expose email or phone on /v1/leads", async () => {
    const res = await request(app).get("/v1/leads?limit=10");
    for (const lead of res.body.data) {
      expect(lead.email).toBeUndefined();
      expect(lead.phone).toBeUndefined();
    }
  });
});
