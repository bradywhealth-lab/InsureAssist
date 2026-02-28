const request = require("supertest");
const { createApp } = require("../src/app");

describe("Campaigns API", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  // ── GET /api/campaigns ────────────────────────────────────────────────
  describe("GET /api/campaigns", () => {
    it("returns all seed campaigns", async () => {
      const res = await request(app).get("/api/campaigns");
      expect(res.status).toBe(200);
      expect(res.body.campaigns).toHaveLength(2);
    });

    it("returns an array in the campaigns field", async () => {
      const res = await request(app).get("/api/campaigns");
      expect(Array.isArray(res.body.campaigns)).toBe(true);
    });
  });

  // ── GET /api/campaigns/:id ────────────────────────────────────────────
  describe("GET /api/campaigns/:id", () => {
    it("returns the correct campaign", async () => {
      const res = await request(app).get("/api/campaigns/camp-1");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("camp-1");
      expect(res.body.name).toBe("Welcome Campaign");
    });

    it("returns 404 for a nonexistent campaign", async () => {
      const res = await request(app).get("/api/campaigns/ghost");
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  // ── POST /api/campaigns ───────────────────────────────────────────────
  describe("POST /api/campaigns", () => {
    it("creates a campaign and returns 201 with generated id", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .send({ name: "Retention Drive", status: "active" });
      expect(res.status).toBe(201);
      expect(typeof res.body.id).toBe("string");
      expect(res.body.name).toBe("Retention Drive");
      expect(res.body.created_at).toBeDefined();
    });

    it("defaults status to active when omitted", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .send({ name: "Auto Status" });
      expect(res.body.status).toBe("active");
    });

    it("newly created campaign appears in GET /api/campaigns", async () => {
      await request(app).post("/api/campaigns").send({ name: "Visible" });
      const list = await request(app).get("/api/campaigns");
      const names = list.body.campaigns.map((c) => c.name);
      expect(names).toContain("Visible");
    });

    it("rejects missing name — 400", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .send({ status: "active" });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    it("rejects invalid status — 400", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .send({ name: "Bad Status", status: "running" });
      expect(res.status).toBe(400);
    });

    it("strips unknown fields", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .send({ name: "Clean", injected: "evil" });
      expect(res.status).toBe(201);
      expect(res.body.injected).toBeUndefined();
    });
  });

  // ── PUT /api/campaigns/:id ────────────────────────────────────────────
  describe("PUT /api/campaigns/:id", () => {
    it("updates a campaign's status", async () => {
      const res = await request(app)
        .put("/api/campaigns/camp-1")
        .send({ status: "paused" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("paused");
    });

    it("updates a campaign's name", async () => {
      const res = await request(app)
        .put("/api/campaigns/camp-2")
        .send({ name: "Renamed Campaign" });
      expect(res.body.name).toBe("Renamed Campaign");
    });

    it("sets updated_at after an update", async () => {
      const res = await request(app).put("/api/campaigns/camp-1").send({ name: "New Name" });
      expect(res.body.updated_at).toBeDefined();
    });

    it("returns 404 for a nonexistent campaign", async () => {
      const res = await request(app)
        .put("/api/campaigns/ghost")
        .send({ name: "No op" });
      expect(res.status).toBe(404);
    });

    it("rejects invalid status on update — 400", async () => {
      const res = await request(app)
        .put("/api/campaigns/camp-1")
        .send({ status: "exploding" });
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/campaigns/:id ─────────────────────────────────────────
  describe("DELETE /api/campaigns/:id", () => {
    it("deletes a campaign and returns ok:true", async () => {
      const res = await request(app).delete("/api/campaigns/camp-2");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("deleted campaign is no longer in GET /api/campaigns", async () => {
      await request(app).delete("/api/campaigns/camp-1");
      const list = await request(app).get("/api/campaigns");
      expect(list.body.campaigns.find((c) => c.id === "camp-1")).toBeUndefined();
    });

    it("returns 404 when deleting a nonexistent campaign", async () => {
      const res = await request(app).delete("/api/campaigns/nothing");
      expect(res.status).toBe(404);
    });
  });
});
