const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("Contacts API", () => {
  // ── GET /api/contacts ────────────────────────────────────────────────────
  describe("GET /api/contacts", () => {
    it("returns paginated contacts", async () => {
      const res = await request(app).get("/api/contacts");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("limit");
    });

    it("returns seed contact data", async () => {
      const res = await request(app).get("/api/contacts");
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("filters by label", async () => {
      const res = await request(app).get("/api/contacts?label=VIP");
      expect(res.status).toBe(200);
      for (const contact of res.body.data) {
        expect(contact.labels).toContain("VIP");
      }
    });

    it("supports pagination", async () => {
      const res = await request(app).get("/api/contacts?page=1&limit=1");
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(1);
    });
  });

  // ── GET /api/contacts/:id ───────────────────────────────────────────────
  describe("GET /api/contacts/:id", () => {
    it("returns a contact by id", async () => {
      const res = await request(app).get("/api/contacts/contact-1");
      expect(res.status).toBe(200);
      expect(res.body.first_name).toBe("Alice");
      expect(res.body.last_name).toBe("Johnson");
    });

    it("includes csv_source metadata", async () => {
      const res = await request(app).get("/api/contacts/contact-1");
      expect(res.body.csv_source).toBeDefined();
      expect(res.body.csv_source.filename).toBe("january_leads.csv");
      expect(res.body.csv_source.uploaded_at).toBeDefined();
    });

    it("includes labels array", async () => {
      const res = await request(app).get("/api/contacts/contact-1");
      expect(res.body.labels).toBeInstanceOf(Array);
      expect(res.body.labels).toContain("VIP");
    });

    it("includes custom_fields", async () => {
      const res = await request(app).get("/api/contacts/contact-1");
      expect(res.body.custom_fields).toBeDefined();
      expect(res.body.custom_fields.preferred_contact).toBe("phone");
    });

    it("returns 404 for unknown contact", async () => {
      const res = await request(app).get("/api/contacts/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/contacts/lead/:leadId ──────────────────────────────────────
  describe("GET /api/contacts/lead/:leadId", () => {
    it("returns contact card for a lead", async () => {
      const res = await request(app).get("/api/contacts/lead/lead-1");
      expect(res.status).toBe(200);
      expect(res.body.lead_id).toBe("lead-1");
      expect(res.body.first_name).toBe("Alice");
    });

    it("returns 404 if no contact for lead", async () => {
      const res = await request(app).get("/api/contacts/lead/lead-999");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/contacts ──────────────────────────────────────────────────
  describe("POST /api/contacts", () => {
    it("creates a new contact", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .send({
          first_name: "David",
          last_name: "Wilson",
          email: "david@example.com",
          phone: "+1-555-0301",
          labels: ["prospect"],
          custom_fields: { industry: "finance" },
        });
      expect(res.status).toBe(201);
      expect(res.body.first_name).toBe("David");
      expect(res.body.labels).toContain("prospect");
      expect(res.body).toHaveProperty("id");
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .send({ first_name: "Test" });
      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/contacts/:id ───────────────────────────────────────────────
  describe("PUT /api/contacts/:id", () => {
    it("updates a contact", async () => {
      const res = await request(app)
        .put("/api/contacts/contact-1")
        .send({ notes: "Updated notes" });
      expect(res.status).toBe(200);
      expect(res.body.notes).toBe("Updated notes");
      expect(res.body).toHaveProperty("updated_at");
    });

    it("returns 404 for unknown contact", async () => {
      const res = await request(app)
        .put("/api/contacts/nonexistent")
        .send({ notes: "test" });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/contacts/:id ────────────────────────────────────────────
  describe("DELETE /api/contacts/:id", () => {
    it("deletes a contact", async () => {
      const created = await request(app)
        .post("/api/contacts")
        .send({ first_name: "Temp", last_name: "Delete" });
      const res = await request(app).delete(`/api/contacts/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 404 for unknown contact", async () => {
      const res = await request(app).delete("/api/contacts/nonexistent");
      expect(res.status).toBe(404);
    });
  });
});
