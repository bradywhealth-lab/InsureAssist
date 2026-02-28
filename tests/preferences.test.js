const request = require("supertest");
const { createApp } = require("../src/app");

describe("Preferences API", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  describe("GET /api/user/preferences", () => {
    it("returns the default preferences object", async () => {
      const res = await request(app).get("/api/user/preferences");
      expect(res.status).toBe(200);
      expect(res.body.preferences).toMatchObject({
        onlysales_enabled: false,
        onlysales_api_key: "",
        onlysales_api_url: "http://localhost:3001",
        auto_sync_leads: true,
        auto_analyze_sentiment: true,
        auto_create_tasks: true,
      });
    });
  });

  describe("POST /api/user/preferences", () => {
    it("merges a partial update and returns updated prefs", async () => {
      const res = await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { onlysales_enabled: true } });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.preferences.onlysales_enabled).toBe(true);
      // Unrelated fields stay intact
      expect(res.body.preferences.auto_sync_leads).toBe(true);
    });

    it("updates multiple fields at once", async () => {
      const res = await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { auto_sync_leads: false, auto_create_tasks: false } });
      expect(res.body.preferences.auto_sync_leads).toBe(false);
      expect(res.body.preferences.auto_create_tasks).toBe(false);
    });

    it("persists across subsequent GET requests", async () => {
      await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { auto_sync_leads: false } });
      const get = await request(app).get("/api/user/preferences");
      expect(get.body.preferences.auto_sync_leads).toBe(false);
    });

    it("masks the onlysales_api_key in GET responses", async () => {
      await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { onlysales_api_key: "sk-secret-key-12345" } });
      const get = await request(app).get("/api/user/preferences");
      // Key should be masked — last 4 chars visible, rest replaced with *
      expect(get.body.preferences.onlysales_api_key).not.toBe("sk-secret-key-12345");
      expect(get.body.preferences.onlysales_api_key).toMatch(/\*+2345$/);
    });

    it("masks the onlysales_api_key in POST responses", async () => {
      const res = await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { onlysales_api_key: "sk-another-key" } });
      expect(res.body.preferences.onlysales_api_key).not.toBe("sk-another-key");
      expect(res.body.preferences.onlysales_api_key).toMatch(/\*+-key$/);
    });

    it("rejects body missing the preferences key — 400", async () => {
      const res = await request(app)
        .post("/api/user/preferences")
        .send({ not_preferences: {} });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("rejects an invalid URL for onlysales_api_url — 400", async () => {
      const res = await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { onlysales_api_url: "not-a-url" } });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    it("accepts a valid URL for onlysales_api_url", async () => {
      const res = await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { onlysales_api_url: "http://api.example.com:8080" } });
      expect(res.status).toBe(200);
    });

    it("rejects payloads over 100 kb — 413", async () => {
      const big = "x".repeat(110 * 1024);
      const res = await request(app)
        .post("/api/user/preferences")
        .set("Content-Type", "application/json")
        .send(`{"preferences":{"onlysales_api_key":"${big}"}}`);
      expect(res.status).toBe(413);
    });
  });
});
