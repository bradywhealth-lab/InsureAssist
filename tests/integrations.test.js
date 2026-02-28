const request = require("supertest");
const { createApp } = require("../src/app");

describe("Integrations API", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  // ── GET /api/integrations/onlysales/sync ──────────────────────────────
  describe("GET /api/integrations/onlysales/sync", () => {
    it("returns sync analytics", async () => {
      const res = await request(app).get("/api/integrations/onlysales/sync");
      expect(res.status).toBe(200);
      expect(typeof res.body.total_leads).toBe("number");
      expect(typeof res.body.total_campaigns).toBe("number");
      expect(Array.isArray(res.body.campaigns)).toBe(true);
      expect(Array.isArray(res.body.sentiment_breakdown)).toBe(true);
    });

    it("reflects current lead count", async () => {
      await request(app)
        .post("/api/leads")
        .send({ name: "Extra Lead", email: "extra@test.com" });
      const res = await request(app).get("/api/integrations/onlysales/sync");
      expect(res.body.total_leads).toBe(4);
    });
  });

  // ── GET /api/integrations/onlysales/status ────────────────────────────
  describe("GET /api/integrations/onlysales/status", () => {
    it("returns connected:false by default", async () => {
      const res = await request(app).get("/api/integrations/onlysales/status");
      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(false);
    });

    it("returns the default api_url", async () => {
      const res = await request(app).get("/api/integrations/onlysales/status");
      expect(res.body.api_url).toBe("http://localhost:3001");
    });

    it("returns last_sync as an ISO date string", async () => {
      const res = await request(app).get("/api/integrations/onlysales/status");
      expect(new Date(res.body.last_sync).getTime()).not.toBeNaN();
    });

    it("returns connected:true after enabling with an API key", async () => {
      await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { onlysales_enabled: true, onlysales_api_key: "sk-test" } });
      const res = await request(app).get("/api/integrations/onlysales/status");
      expect(res.body.connected).toBe(true);
    });

    it("returns connected:false when enabled but key is empty", async () => {
      await request(app)
        .post("/api/user/preferences")
        .send({ preferences: { onlysales_enabled: true, onlysales_api_key: "" } });
      const res = await request(app).get("/api/integrations/onlysales/status");
      expect(res.body.connected).toBe(false);
    });
  });

  // ── POST /api/integrations/onlysales/webhook ──────────────────────────
  describe("POST /api/integrations/onlysales/webhook", () => {
    it("acknowledges any payload with ok:true", async () => {
      const res = await request(app)
        .post("/api/integrations/onlysales/webhook")
        .send({ event: "lead.created", lead_id: "abc" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("accepts empty body", async () => {
      const res = await request(app)
        .post("/api/integrations/onlysales/webhook")
        .send({});
      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/analytics ────────────────────────────────────────────────
  describe("GET /api/analytics", () => {
    it("returns total_leads and total_campaigns", async () => {
      const res = await request(app).get("/api/analytics");
      expect(res.status).toBe(200);
      expect(res.body.total_leads).toBe(3);
      expect(res.body.total_campaigns).toBe(2);
    });

    it("includes sentiment_breakdown entries for each status in the dataset", async () => {
      const res = await request(app).get("/api/analytics");
      const sentiments = res.body.sentiment_breakdown.map((s) => s.sentiment);
      expect(sentiments).toContain("interested");
      expect(sentiments).toContain("neutral");
      expect(sentiments).toContain("not_interested");
    });

    it("updates total_leads after a new lead is created", async () => {
      await request(app)
        .post("/api/leads")
        .send({ name: "New Lead", email: "new@test.com" });
      const res = await request(app).get("/api/analytics");
      expect(res.body.total_leads).toBe(4);
    });
  });
});
