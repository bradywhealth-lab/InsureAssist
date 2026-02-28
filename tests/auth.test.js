const request = require("supertest");
const { createApp } = require("../src/app");

// ── API key middleware ────────────────────────────────────────────────────
describe("API key authentication", () => {
  const TEST_KEY = "test-secret-key-abc123";

  describe("when API_KEY is not set (auth disabled)", () => {
    let app;
    beforeEach(() => {
      delete process.env.API_KEY;
      app = createApp();
    });

    it("allows requests to protected routes without a key", async () => {
      const res = await request(app).get("/api/user/preferences");
      expect(res.status).toBe(200);
    });
  });

  describe("when API_KEY is set", () => {
    let app;
    beforeEach(() => {
      process.env.API_KEY = TEST_KEY;
      app = createApp();
    });

    it("rejects requests with no key — 401", async () => {
      const res = await request(app).get("/api/user/preferences");
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it("rejects requests with a wrong key — 401", async () => {
      const res = await request(app)
        .get("/api/user/preferences")
        .set("X-API-Key", "wrong-key");
      expect(res.status).toBe(401);
    });

    it("accepts correct key via X-API-Key header — 200", async () => {
      const res = await request(app)
        .get("/api/user/preferences")
        .set("X-API-Key", TEST_KEY);
      expect(res.status).toBe(200);
    });

    it("accepts correct key via Authorization Bearer — 200", async () => {
      const res = await request(app)
        .get("/api/user/preferences")
        .set("Authorization", `Bearer ${TEST_KEY}`);
      expect(res.status).toBe(200);
    });

    it("always allows /health without a key", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    });

    it("always allows /leads (legacy public endpoint) without a key", async () => {
      const res = await request(app).get("/leads");
      expect(res.status).toBe(200);
    });
  });
});

// ── POST /api/auth/token ─────────────────────────────────────────────────
describe("POST /api/auth/token", () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  it("returns a token with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/token")
      .send({ username: "admin", password: "any-password" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.expires_in).toBe(3600);
  });

  it("returns mock-dev-token when API_KEY is not set", async () => {
    delete process.env.API_KEY;
    app = createApp();
    const res = await request(app)
      .post("/api/auth/token")
      .send({ username: "u", password: "p" });
    expect(res.body.token).toBe("mock-dev-token");
  });

  it("returns the configured API_KEY as the token", async () => {
    process.env.API_KEY = "configured-key";
    app = createApp();
    const res = await request(app)
      .post("/api/auth/token")
      .send({ username: "u", password: "p" });
    expect(res.body.token).toBe("configured-key");
  });

  it("rejects missing username — 400", async () => {
    const res = await request(app)
      .post("/api/auth/token")
      .send({ password: "pass" });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("rejects missing password — 400", async () => {
    const res = await request(app)
      .post("/api/auth/token")
      .send({ username: "user" });
    expect(res.status).toBe(400);
  });

  it("rejects empty body — 400", async () => {
    const res = await request(app).post("/api/auth/token").send({});
    expect(res.status).toBe(400);
  });
});
