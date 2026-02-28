const request = require("supertest");
const { createApp } = require("../src/app");

describe("Leads API", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  // ── GET /api/leads ────────────────────────────────────────────────────
  describe("GET /api/leads", () => {
    it("returns paginated leads with metadata", async () => {
      const res = await request(app).get("/api/leads");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(typeof res.body.total).toBe("number");
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });

    it("returns all 3 seed leads by default", async () => {
      const res = await request(app).get("/api/leads");
      expect(res.body.total).toBe(3);
      expect(res.body.data).toHaveLength(3);
    });

    it("respects the limit query param", async () => {
      const res = await request(app).get("/api/leads?limit=1");
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(3);
    });

    it("respects the page query param", async () => {
      const res = await request(app).get("/api/leads?limit=2&page=2");
      expect(res.body.data).toHaveLength(1);
      expect(res.body.page).toBe(2);
    });

    it("filters by status", async () => {
      const res = await request(app).get("/api/leads?status=interested");
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((l) => l.status === "interested")).toBe(true);
    });

    it("filters by campaign_id", async () => {
      const res = await request(app).get("/api/leads?campaign_id=camp-1");
      expect(res.body.data.every((l) => l.campaign_id === "camp-1")).toBe(true);
    });

    it("returns empty data for unmatched filter", async () => {
      const res = await request(app).get("/api/leads?status=interested&campaign_id=camp-2");
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  // ── GET /api/leads/:id ────────────────────────────────────────────────
  describe("GET /api/leads/:id", () => {
    it("returns the correct lead", async () => {
      const res = await request(app).get("/api/leads/lead-1");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("lead-1");
      expect(res.body.name).toBe("Alice Johnson");
    });

    it("returns 404 for a nonexistent ID", async () => {
      const res = await request(app).get("/api/leads/does-not-exist");
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  // ── POST /api/leads ───────────────────────────────────────────────────
  describe("POST /api/leads", () => {
    it("creates a lead and returns 201 with generated id", async () => {
      const res = await request(app)
        .post("/api/leads")
        .send({ name: "Dave Lee", email: "dave@example.com", status: "interested" });
      expect(res.status).toBe(201);
      expect(typeof res.body.id).toBe("string");
      expect(res.body.name).toBe("Dave Lee");
      expect(res.body.email).toBe("dave@example.com");
      expect(res.body.created_at).toBeDefined();
    });

    it("newly created lead is retrievable by GET", async () => {
      const create = await request(app)
        .post("/api/leads")
        .send({ name: "Eve Lane", email: "eve@example.com" });
      const get = await request(app).get(`/api/leads/${create.body.id}`);
      expect(get.status).toBe(200);
      expect(get.body.email).toBe("eve@example.com");
    });

    it("defaults status to neutral when omitted", async () => {
      const res = await request(app)
        .post("/api/leads")
        .send({ name: "Frank", email: "frank@example.com" });
      expect(res.body.status).toBe("neutral");
    });

    it("rejects missing name — 400", async () => {
      const res = await request(app)
        .post("/api/leads")
        .send({ email: "test@example.com" });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    it("rejects missing email — 400", async () => {
      const res = await request(app)
        .post("/api/leads")
        .send({ name: "No Email" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid email format — 400", async () => {
      const res = await request(app)
        .post("/api/leads")
        .send({ name: "Bad", email: "not-an-email" });
      expect(res.status).toBe(400);
    });

    it("rejects unknown status values — 400", async () => {
      const res = await request(app)
        .post("/api/leads")
        .send({ name: "X", email: "x@x.com", status: "garbage" });
      expect(res.status).toBe(400);
    });

    it("strips unknown fields from the body", async () => {
      const res = await request(app)
        .post("/api/leads")
        .send({ name: "Safe", email: "safe@test.com", hacked: "payload" });
      expect(res.status).toBe(201);
      expect(res.body.hacked).toBeUndefined();
    });
  });

  // ── PUT /api/leads/:id ────────────────────────────────────────────────
  describe("PUT /api/leads/:id", () => {
    it("updates a lead's status", async () => {
      const res = await request(app)
        .put("/api/leads/lead-1")
        .send({ status: "not_interested" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("not_interested");
      expect(res.body.id).toBe("lead-1");
    });

    it("preserves unmodified fields", async () => {
      await request(app).put("/api/leads/lead-2").send({ status: "interested" });
      const get = await request(app).get("/api/leads/lead-2");
      expect(get.body.email).toBe("bob@example.com");
    });

    it("sets updated_at after an update", async () => {
      const res = await request(app).put("/api/leads/lead-1").send({ name: "Alice J. (updated)" });
      expect(res.body.updated_at).toBeDefined();
    });

    it("returns 404 for nonexistent lead", async () => {
      const res = await request(app).put("/api/leads/ghost").send({ status: "neutral" });
      expect(res.status).toBe(404);
    });

    it("rejects invalid status on update — 400", async () => {
      const res = await request(app).put("/api/leads/lead-1").send({ status: "bad" });
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/leads/:id ─────────────────────────────────────────────
  describe("DELETE /api/leads/:id", () => {
    it("deletes a lead and returns ok:true", async () => {
      const res = await request(app).delete("/api/leads/lead-3");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("deleted lead is no longer accessible via GET", async () => {
      await request(app).delete("/api/leads/lead-3");
      const get = await request(app).get("/api/leads/lead-3");
      expect(get.status).toBe(404);
    });

    it("returns 404 when deleting a nonexistent lead", async () => {
      const res = await request(app).delete("/api/leads/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── Legacy /leads endpoint ────────────────────────────────────────────
  describe("GET /leads (legacy OnlySales mock)", () => {
    it("returns a data array", async () => {
      const res = await request(app).get("/leads");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("respects the limit query param", async () => {
      const res = await request(app).get("/leads?limit=2");
      expect(res.body.data).toHaveLength(2);
    });

    it("also responds at /v1/leads", async () => {
      const res = await request(app).get("/v1/leads?limit=1");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("does not require API key", async () => {
      process.env.API_KEY = "some-key";
      const localApp = createApp();
      const res = await request(localApp).get("/leads");
      expect(res.status).toBe(200);
    });
  });
});
