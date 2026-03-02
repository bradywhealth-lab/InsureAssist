const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("CSV Upload API", () => {
  // ── GET /api/csv-uploads ─────────────────────────────────────────────────
  describe("GET /api/csv-uploads", () => {
    it("returns all CSV upload records", async () => {
      const res = await request(app).get("/api/csv-uploads");
      expect(res.status).toBe(200);
      expect(res.body.uploads).toBeInstanceOf(Array);
      expect(res.body.uploads.length).toBeGreaterThanOrEqual(2);
    });

    it("each upload has filename and status", async () => {
      const res = await request(app).get("/api/csv-uploads");
      for (const upload of res.body.uploads) {
        expect(upload).toHaveProperty("filename");
        expect(upload).toHaveProperty("status");
        expect(upload).toHaveProperty("rows_total");
        expect(upload).toHaveProperty("rows_imported");
      }
    });
  });

  // ── GET /api/csv-uploads/:id ────────────────────────────────────────────
  describe("GET /api/csv-uploads/:id", () => {
    it("returns a CSV upload by id", async () => {
      const res = await request(app).get("/api/csv-uploads/csv-1");
      expect(res.status).toBe(200);
      expect(res.body.filename).toBe("january_leads.csv");
      expect(res.body.rows_total).toBe(50);
      expect(res.body.rows_imported).toBe(48);
    });

    it("returns 404 for unknown upload", async () => {
      const res = await request(app).get("/api/csv-uploads/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/csv-uploads ───────────────────────────────────────────────
  describe("POST /api/csv-uploads", () => {
    it("imports leads from a CSV-like payload", async () => {
      const res = await request(app)
        .post("/api/csv-uploads")
        .send({
          filename: "march_leads.csv",
          leads: [
            { name: "Erica Frost", email: "erica@example.com", phone: "+1-555-0401" },
            { name: "Frank Green", email: "frank@example.com", phone: "+1-555-0402" },
            { name: "Grace Hill", email: "grace@example.com" },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.imported).toBe(3);
      expect(res.body.skipped).toBe(0);
      expect(res.body.upload).toHaveProperty("id");
      expect(res.body.upload.filename).toBe("march_leads.csv");
      expect(res.body.upload.status).toBe("completed");
    });

    it("tags imported leads with csv_source metadata", async () => {
      const uploadRes = await request(app)
        .post("/api/csv-uploads")
        .send({
          filename: "test_source.csv",
          leads: [{ name: "Source Test", email: "source@test.com" }],
        });
      const leadId = uploadRes.body.upload.lead_ids[0];
      const leadRes = await request(app).get(`/api/leads/${leadId}`);
      expect(leadRes.body.csv_source).toBeDefined();
      expect(leadRes.body.csv_source.filename).toBe("test_source.csv");
      expect(leadRes.body.csv_source.uploaded_at).toBeDefined();
      expect(leadRes.body.csv_source.upload_id).toBe(uploadRes.body.upload.id);
    });

    it("skips rows with missing required fields", async () => {
      const res = await request(app)
        .post("/api/csv-uploads")
        .send({
          filename: "partial.csv",
          leads: [
            { name: "Valid Lead", email: "valid@example.com" },
            { name: "No Email" },
            { email: "noemail@example.com" },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.imported).toBe(1);
      expect(res.body.skipped).toBe(2);
      expect(res.body.errors).toHaveLength(2);
    });

    it("rejects missing filename", async () => {
      const res = await request(app)
        .post("/api/csv-uploads")
        .send({ leads: [{ name: "test", email: "test@test.com" }] });
      expect(res.status).toBe(400);
    });

    it("rejects empty leads array", async () => {
      const res = await request(app)
        .post("/api/csv-uploads")
        .send({ filename: "empty.csv", leads: [] });
      expect(res.status).toBe(400);
    });

    it("rejects missing leads", async () => {
      const res = await request(app)
        .post("/api/csv-uploads")
        .send({ filename: "no_leads.csv" });
      expect(res.status).toBe(400);
    });
  });
});
