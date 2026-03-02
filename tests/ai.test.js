const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("AI & Insights API", () => {
  // ── GET /api/ai/insights ─────────────────────────────────────────────────
  describe("GET /api/ai/insights", () => {
    it("returns all AI insights", async () => {
      const res = await request(app).get("/api/ai/insights");
      expect(res.status).toBe(200);
      expect(res.body.insights).toBeInstanceOf(Array);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it("filters by lead_id", async () => {
      const res = await request(app).get("/api/ai/insights?lead_id=lead-1");
      expect(res.status).toBe(200);
      for (const insight of res.body.insights) {
        expect(insight.lead_id).toBe("lead-1");
      }
    });

    it("filters by type", async () => {
      const res = await request(app).get("/api/ai/insights?type=lead_scoring");
      expect(res.status).toBe(200);
      for (const insight of res.body.insights) {
        expect(insight.type).toBe("lead_scoring");
      }
    });
  });

  // ── GET /api/ai/insights/:id ────────────────────────────────────────────
  describe("GET /api/ai/insights/:id", () => {
    it("returns an insight by id", async () => {
      const res = await request(app).get("/api/ai/insights/insight-1");
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("lead_scoring");
      expect(res.body.score).toBe(85);
      expect(res.body.recommendations).toBeInstanceOf(Array);
    });

    it("returns 404 for unknown insight", async () => {
      const res = await request(app).get("/api/ai/insights/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/ai/score/:leadId ──────────────────────────────────────────
  describe("POST /api/ai/score/:leadId", () => {
    it("generates an AI lead score", async () => {
      const res = await request(app).post("/api/ai/score/lead-1");
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("score");
      expect(res.body.score).toBeGreaterThanOrEqual(0);
      expect(res.body.score).toBeLessThanOrEqual(100);
      expect(res.body.type).toBe("lead_scoring");
      expect(res.body.lead_id).toBe("lead-1");
      expect(res.body.recommendations).toBeInstanceOf(Array);
      expect(res.body.reasoning).toBeDefined();
    });

    it("scores interested lead higher than not_interested", async () => {
      const interested = await request(app).post("/api/ai/score/lead-1");
      const notInterested = await request(app).post("/api/ai/score/lead-3");
      expect(interested.body.score).toBeGreaterThan(notInterested.body.score);
    });

    it("returns 404 for unknown lead", async () => {
      const res = await request(app).post("/api/ai/score/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/ai/score-all ──────────────────────────────────────────────
  describe("POST /api/ai/score-all", () => {
    it("scores all leads", async () => {
      const res = await request(app).post("/api/ai/score-all");
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.scored).toBeGreaterThanOrEqual(3);
      expect(res.body.insights).toBeInstanceOf(Array);
    });
  });

  // ── GET /api/ai/recommendations/:leadId ─────────────────────────────────
  describe("GET /api/ai/recommendations/:leadId", () => {
    it("returns contextual recommendations for a lead", async () => {
      const res = await request(app).get("/api/ai/recommendations/lead-1");
      expect(res.status).toBe(200);
      expect(res.body.lead_id).toBe("lead-1");
      expect(res.body.recommendations).toBeInstanceOf(Array);
      for (const rec of res.body.recommendations) {
        expect(rec).toHaveProperty("action");
        expect(rec).toHaveProperty("priority");
        expect(rec).toHaveProperty("message");
      }
    });

    it("returns 404 for unknown lead", async () => {
      const res = await request(app).get("/api/ai/recommendations/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/ai/dashboard ───────────────────────────────────────────────
  describe("GET /api/ai/dashboard", () => {
    it("returns AI-powered dashboard summary", async () => {
      const res = await request(app).get("/api/ai/dashboard");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("summary");
      expect(res.body).toHaveProperty("action_items");
      expect(res.body).toHaveProperty("hot_leads");
      expect(res.body.summary).toHaveProperty("total_leads");
      expect(res.body.summary).toHaveProperty("hot_leads");
      expect(res.body.summary).toHaveProperty("untouched_leads");
      expect(res.body.summary).toHaveProperty("pending_tasks");
      expect(res.body.action_items).toBeInstanceOf(Array);
    });

    it("action items have type and priority", async () => {
      const res = await request(app).get("/api/ai/dashboard");
      for (const item of res.body.action_items) {
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("priority");
        expect(item).toHaveProperty("message");
      }
    });
  });
});
