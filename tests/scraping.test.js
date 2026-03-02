const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("Scraping API", () => {
  // ── GET /api/scraping ────────────────────────────────────────────────────
  describe("GET /api/scraping", () => {
    it("returns all scraping jobs", async () => {
      const res = await request(app).get("/api/scraping");
      expect(res.status).toBe(200);
      expect(res.body.jobs).toBeInstanceOf(Array);
    });
  });

  // ── POST /api/scraping ───────────────────────────────────────────────────
  describe("POST /api/scraping", () => {
    it("creates a new scraping job", async () => {
      const res = await request(app)
        .post("/api/scraping")
        .send({
          name: "Insurance Agents Directory",
          type: "directory",
          target_url: "https://example.com/insurance-agents",
          search_query: "life insurance",
          location: "Austin, TX",
          max_results: 25,
        });
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.job).toHaveProperty("id");
      expect(res.body.job.status).toBe("queued");
      expect(res.body.job.name).toBe("Insurance Agents Directory");
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/api/scraping")
        .send({ name: "test" });
      expect(res.status).toBe(400);
    });

    it("validates target_url as URI", async () => {
      const res = await request(app)
        .post("/api/scraping")
        .send({ name: "test", target_url: "not-a-url" });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/scraping/:id ───────────────────────────────────────────────
  describe("GET /api/scraping/:id", () => {
    it("returns a scraping job by id", async () => {
      const created = await request(app)
        .post("/api/scraping")
        .send({
          name: "Test Job",
          target_url: "https://example.com/directory",
        });
      const res = await request(app).get(`/api/scraping/${created.body.job.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Test Job");
    });

    it("returns 404 for unknown job", async () => {
      const res = await request(app).get("/api/scraping/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/scraping/:id/import ───────────────────────────────────────
  describe("POST /api/scraping/:id/import", () => {
    it("imports scraped results as leads after job completes", async () => {
      const created = await request(app)
        .post("/api/scraping")
        .send({
          name: "Import Test",
          target_url: "https://example.com/agents",
        });
      // Wait for simulated scraping to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      const res = await request(app).post(`/api/scraping/${created.body.job.id}/import`);
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.imported).toBeGreaterThan(0);
      expect(res.body.leads).toBeInstanceOf(Array);
      for (const lead of res.body.leads) {
        expect(lead.tags).toContain("scraped");
      }
    });

    it("rejects import for non-completed job", async () => {
      // Create a job but don't wait for it to complete
      const created = await request(app)
        .post("/api/scraping")
        .send({
          name: "Not Ready",
          target_url: "https://example.com/test",
        });
      const res = await request(app).post(`/api/scraping/${created.body.job.id}/import`);
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown job", async () => {
      const res = await request(app).post("/api/scraping/nonexistent/import");
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/scraping/:id ────────────────────────────────────────────
  describe("DELETE /api/scraping/:id", () => {
    it("deletes a scraping job", async () => {
      const created = await request(app)
        .post("/api/scraping")
        .send({
          name: "To Delete",
          target_url: "https://example.com/del",
        });
      const res = await request(app).delete(`/api/scraping/${created.body.job.id}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 404 for unknown job", async () => {
      const res = await request(app).delete("/api/scraping/nonexistent");
      expect(res.status).toBe(404);
    });
  });
});
