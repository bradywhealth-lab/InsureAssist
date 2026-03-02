const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("Tags API", () => {
  // ── GET /api/tags ────────────────────────────────────────────────────────
  describe("GET /api/tags", () => {
    it("returns all seed tags", async () => {
      const res = await request(app).get("/api/tags");
      expect(res.status).toBe(200);
      expect(res.body.tags).toBeInstanceOf(Array);
      expect(res.body.tags.length).toBeGreaterThanOrEqual(6);
    });

    it("each tag has id, name, and color", async () => {
      const res = await request(app).get("/api/tags");
      for (const tag of res.body.tags) {
        expect(tag).toHaveProperty("id");
        expect(tag).toHaveProperty("name");
        expect(tag).toHaveProperty("color");
      }
    });
  });

  // ── GET /api/tags/:id ───────────────────────────────────────────────────
  describe("GET /api/tags/:id", () => {
    it("returns a tag by id", async () => {
      const res = await request(app).get("/api/tags/tag-1");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("hot-lead");
    });

    it("returns 404 for unknown tag", async () => {
      const res = await request(app).get("/api/tags/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/tags ──────────────────────────────────────────────────────
  describe("POST /api/tags", () => {
    it("creates a new tag", async () => {
      const res = await request(app)
        .post("/api/tags")
        .send({ name: "urgent", color: "#dc2626" });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("urgent");
      expect(res.body.color).toBe("#dc2626");
      expect(res.body).toHaveProperty("id");
    });

    it("returns existing tag if name already exists", async () => {
      const res = await request(app)
        .post("/api/tags")
        .send({ name: "hot-lead", color: "#000000" });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe("tag-1");
    });

    it("rejects invalid color format", async () => {
      const res = await request(app)
        .post("/api/tags")
        .send({ name: "test", color: "red" });
      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/tags/:id ───────────────────────────────────────────────────
  describe("PUT /api/tags/:id", () => {
    it("updates an existing tag", async () => {
      const res = await request(app)
        .put("/api/tags/tag-2")
        .send({ color: "#1e40af" });
      expect(res.status).toBe(200);
      expect(res.body.color).toBe("#1e40af");
    });

    it("returns 404 for unknown tag", async () => {
      const res = await request(app)
        .put("/api/tags/nonexistent")
        .send({ color: "#000000" });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/tags/:id ────────────────────────────────────────────────
  describe("DELETE /api/tags/:id", () => {
    it("deletes an existing tag", async () => {
      // Create then delete
      const created = await request(app)
        .post("/api/tags")
        .send({ name: "to-delete" });
      const res = await request(app).delete(`/api/tags/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 404 for unknown tag", async () => {
      const res = await request(app).delete("/api/tags/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── Lead tag operations ─────────────────────────────────────────────────
  describe("POST /api/leads/:id/tags", () => {
    it("adds a tag to a lead", async () => {
      const res = await request(app)
        .post("/api/leads/lead-2/tags")
        .send({ tag: "vip" });
      expect(res.status).toBe(200);
      expect(res.body.tags).toContain("vip");
    });

    it("does not duplicate tags", async () => {
      await request(app).post("/api/leads/lead-1/tags").send({ tag: "hot-lead" });
      const res = await request(app)
        .post("/api/leads/lead-1/tags")
        .send({ tag: "hot-lead" });
      const count = res.body.tags.filter((t) => t === "hot-lead").length;
      expect(count).toBe(1);
    });

    it("returns 400 if tag is missing", async () => {
      const res = await request(app)
        .post("/api/leads/lead-1/tags")
        .send({});
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown lead", async () => {
      const res = await request(app)
        .post("/api/leads/nonexistent/tags")
        .send({ tag: "test" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/leads/:id/tags/:tagName", () => {
    it("removes a tag from a lead", async () => {
      const res = await request(app).delete("/api/leads/lead-3/tags/dnc");
      expect(res.status).toBe(200);
      expect(res.body.tags).not.toContain("dnc");
    });

    it("returns 404 for unknown lead", async () => {
      const res = await request(app).delete("/api/leads/nonexistent/tags/test");
      expect(res.status).toBe(404);
    });
  });

  // ── Lead disposition ────────────────────────────────────────────────────
  describe("PUT /api/leads/:id/disposition", () => {
    it("sets lead disposition", async () => {
      const res = await request(app)
        .put("/api/leads/lead-1/disposition")
        .send({ disposition: "appointment_set" });
      expect(res.status).toBe(200);
      expect(res.body.disposition).toBe("appointment_set");
    });

    it("rejects invalid disposition", async () => {
      const res = await request(app)
        .put("/api/leads/lead-1/disposition")
        .send({ disposition: "invalid" });
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown lead", async () => {
      const res = await request(app)
        .put("/api/leads/nonexistent/disposition")
        .send({ disposition: "new" });
      expect(res.status).toBe(404);
    });
  });
});
