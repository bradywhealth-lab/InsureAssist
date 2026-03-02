const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("Follow-ups API", () => {
  // ── GET /api/followups ───────────────────────────────────────────────────
  describe("GET /api/followups", () => {
    it("returns all follow-up sequences", async () => {
      const res = await request(app).get("/api/followups");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("followups");
      expect(res.body).toHaveProperty("count");
      expect(res.body.followups.length).toBeGreaterThanOrEqual(1);
    });

    it("filters by lead_id", async () => {
      const res = await request(app).get("/api/followups?lead_id=lead-1");
      expect(res.status).toBe(200);
      for (const f of res.body.followups) {
        expect(f.lead_id).toBe("lead-1");
      }
    });

    it("filters by status", async () => {
      const res = await request(app).get("/api/followups?status=active");
      expect(res.status).toBe(200);
      for (const f of res.body.followups) {
        expect(f.status).toBe("active");
      }
    });
  });

  // ── GET /api/followups/:id ──────────────────────────────────────────────
  describe("GET /api/followups/:id", () => {
    it("returns a follow-up sequence by id", async () => {
      const res = await request(app).get("/api/followups/followup-1");
      expect(res.status).toBe(200);
      expect(res.body.sequence_name).toBe("New Lead Nurture");
      expect(res.body.actions).toBeInstanceOf(Array);
      expect(res.body.actions.length).toBe(5);
    });

    it("returns 404 for unknown follow-up", async () => {
      const res = await request(app).get("/api/followups/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/followups ─────────────────────────────────────────────────
  describe("POST /api/followups", () => {
    it("creates a new follow-up sequence", async () => {
      const res = await request(app)
        .post("/api/followups")
        .send({
          lead_id: "lead-2",
          sequence_name: "Cold Outreach",
          total_steps: 3,
          actions: [
            { step: 1, type: "sms", template: "cold_intro" },
            { step: 2, type: "call", template: "follow_call" },
            { step: 3, type: "email", template: "last_chance" },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.sequence_name).toBe("Cold Outreach");
      expect(res.body.status).toBe("active");
      expect(res.body).toHaveProperty("id");
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/api/followups")
        .send({ lead_id: "lead-1" });
      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/followups/:id/advance ──────────────────────────────────────
  describe("PUT /api/followups/:id/advance", () => {
    it("advances to the next step", async () => {
      const res = await request(app).put("/api/followups/followup-1/advance");
      expect(res.status).toBe(200);
      // The second step should now be completed (first was already completed in seed)
      const completedSteps = res.body.actions.filter((a) => a.completed);
      expect(completedSteps.length).toBeGreaterThanOrEqual(2);
    });

    it("returns 404 for unknown follow-up", async () => {
      const res = await request(app).put("/api/followups/nonexistent/advance");
      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/followups/:id/pause ────────────────────────────────────────
  describe("PUT /api/followups/:id/pause", () => {
    it("pauses a follow-up sequence", async () => {
      const res = await request(app).put("/api/followups/followup-1/pause");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("paused");
    });

    it("returns 404 for unknown follow-up", async () => {
      const res = await request(app).put("/api/followups/nonexistent/pause");
      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/followups/:id/resume ───────────────────────────────────────
  describe("PUT /api/followups/:id/resume", () => {
    it("resumes a paused follow-up sequence", async () => {
      // First pause, then resume
      await request(app).put("/api/followups/followup-1/pause");
      const res = await request(app).put("/api/followups/followup-1/resume");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("active");
    });

    it("returns 404 for unknown follow-up", async () => {
      const res = await request(app).put("/api/followups/nonexistent/resume");
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/followups/:id ───────────────────────────────────────────
  describe("DELETE /api/followups/:id", () => {
    it("deletes a follow-up sequence", async () => {
      const created = await request(app)
        .post("/api/followups")
        .send({
          lead_id: "lead-3",
          sequence_name: "To Delete",
          total_steps: 1,
          actions: [{ step: 1, type: "sms", template: "test" }],
        });
      const res = await request(app).delete(`/api/followups/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 404 for unknown follow-up", async () => {
      const res = await request(app).delete("/api/followups/nonexistent");
      expect(res.status).toBe(404);
    });
  });
});
