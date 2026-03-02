const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("Marketing & Social Media API", () => {
  // ── GET /api/marketing ───────────────────────────────────────────────────
  describe("GET /api/marketing", () => {
    it("returns all marketing campaigns", async () => {
      const res = await request(app).get("/api/marketing");
      expect(res.status).toBe(200);
      expect(res.body.campaigns).toBeInstanceOf(Array);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it("filters by platform", async () => {
      const res = await request(app).get("/api/marketing?platform=facebook");
      expect(res.status).toBe(200);
      for (const campaign of res.body.campaigns) {
        expect(campaign.platform).toBe("facebook");
      }
    });

    it("filters by status", async () => {
      const res = await request(app).get("/api/marketing?status=active");
      expect(res.status).toBe(200);
      for (const campaign of res.body.campaigns) {
        expect(campaign.status).toBe("active");
      }
    });
  });

  // ── GET /api/marketing/:id ──────────────────────────────────────────────
  describe("GET /api/marketing/:id", () => {
    it("returns a marketing campaign by id", async () => {
      const res = await request(app).get("/api/marketing/mktg-1");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Facebook Life Insurance Ad");
      expect(res.body.platform).toBe("facebook");
      expect(res.body.metrics).toBeDefined();
    });

    it("returns 404 for unknown campaign", async () => {
      const res = await request(app).get("/api/marketing/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/marketing ─────────────────────────────────────────────────
  describe("POST /api/marketing", () => {
    it("creates a new marketing campaign", async () => {
      const res = await request(app)
        .post("/api/marketing")
        .send({
          name: "Instagram Reel Campaign",
          platform: "instagram",
          type: "reel",
          content: "Watch how easy it is to get covered! Life insurance in 10 minutes.",
          schedule: {
            frequency: "weekly",
            time: "12:00",
            timezone: "America/New_York",
          },
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Instagram Reel Campaign");
      expect(res.body.platform).toBe("instagram");
      expect(res.body.type).toBe("reel");
      expect(res.body.status).toBe("draft");
    });

    it("creates email blast campaign", async () => {
      const res = await request(app)
        .post("/api/marketing")
        .send({
          name: "Monthly Newsletter",
          platform: "email",
          type: "email_blast",
          content: "Here's what's new this month in insurance...",
        });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe("email_blast");
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/api/marketing")
        .send({ name: "test" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid platform", async () => {
      const res = await request(app)
        .post("/api/marketing")
        .send({ name: "test", platform: "myspace", content: "test" });
      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/marketing/:id ──────────────────────────────────────────────
  describe("PUT /api/marketing/:id", () => {
    it("updates a marketing campaign", async () => {
      const res = await request(app)
        .put("/api/marketing/mktg-1")
        .send({ content: "Updated ad copy for life insurance." });
      expect(res.status).toBe(200);
      expect(res.body.content).toBe("Updated ad copy for life insurance.");
    });

    it("returns 404 for unknown campaign", async () => {
      const res = await request(app)
        .put("/api/marketing/nonexistent")
        .send({ name: "test" });
      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/marketing/:id/activate ─────────────────────────────────────
  describe("PUT /api/marketing/:id/activate", () => {
    it("activates a campaign", async () => {
      const created = await request(app)
        .post("/api/marketing")
        .send({ name: "Activate Me", platform: "twitter", content: "Test tweet" });
      const res = await request(app).put(`/api/marketing/${created.body.id}/activate`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("active");
    });
  });

  // ── PUT /api/marketing/:id/pause ────────────────────────────────────────
  describe("PUT /api/marketing/:id/pause", () => {
    it("pauses a campaign", async () => {
      const res = await request(app).put("/api/marketing/mktg-1/pause");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("paused");
    });
  });

  // ── DELETE /api/marketing/:id ───────────────────────────────────────────
  describe("DELETE /api/marketing/:id", () => {
    it("deletes a marketing campaign", async () => {
      const created = await request(app)
        .post("/api/marketing")
        .send({ name: "Delete Me", platform: "linkedin", content: "Test" });
      const res = await request(app).delete(`/api/marketing/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 404 for unknown campaign", async () => {
      const res = await request(app).delete("/api/marketing/nonexistent");
      expect(res.status).toBe(404);
    });
  });
});
