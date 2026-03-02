const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("Messages / Texting API", () => {
  // ── GET /api/messages ────────────────────────────────────────────────────
  describe("GET /api/messages", () => {
    it("returns paginated messages", async () => {
      const res = await request(app).get("/api/messages");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("filters by lead_id", async () => {
      const res = await request(app).get("/api/messages?lead_id=lead-1");
      expect(res.status).toBe(200);
      for (const msg of res.body.data) {
        expect(msg.lead_id).toBe("lead-1");
      }
    });

    it("filters by direction", async () => {
      const res = await request(app).get("/api/messages?direction=outbound");
      expect(res.status).toBe(200);
      for (const msg of res.body.data) {
        expect(msg.direction).toBe("outbound");
      }
    });

    it("filters by channel", async () => {
      const res = await request(app).get("/api/messages?channel=sms");
      expect(res.status).toBe(200);
      for (const msg of res.body.data) {
        expect(msg.channel).toBe("sms");
      }
    });
  });

  // ── GET /api/messages/:id ───────────────────────────────────────────────
  describe("GET /api/messages/:id", () => {
    it("returns a message by id", async () => {
      const res = await request(app).get("/api/messages/msg-1");
      expect(res.status).toBe(200);
      expect(res.body.channel).toBe("sms");
      expect(res.body.direction).toBe("outbound");
    });

    it("returns 404 for unknown message", async () => {
      const res = await request(app).get("/api/messages/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/messages (send SMS) ───────────────────────────────────────
  describe("POST /api/messages", () => {
    it("sends a text message", async () => {
      const res = await request(app)
        .post("/api/messages")
        .send({
          lead_id: "lead-1",
          to: "+1-555-0101",
          body: "Hi Alice, just checking in!",
          channel: "sms",
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("delivered");
      expect(res.body.sent_at).toBeDefined();
      expect(res.body.direction).toBe("outbound");
    });

    it("updates lead last_contacted_at on outbound message", async () => {
      await request(app)
        .post("/api/messages")
        .send({
          lead_id: "lead-2",
          to: "+1-555-0102",
          body: "Reaching out!",
        });
      const lead = await request(app).get("/api/leads/lead-2");
      expect(lead.body.last_contacted_at).toBeDefined();
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/api/messages")
        .send({ to: "+1-555-0101" });
      expect(res.status).toBe(400);
    });

    it("rejects empty body", async () => {
      const res = await request(app)
        .post("/api/messages")
        .send({ to: "+1-555-0101", body: "" });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/messages/conversation/:leadId ──────────────────────────────
  describe("GET /api/messages/conversation/:leadId", () => {
    it("returns full conversation thread for a lead", async () => {
      const res = await request(app).get("/api/messages/conversation/lead-1");
      expect(res.status).toBe(200);
      expect(res.body.lead_id).toBe("lead-1");
      expect(res.body.messages).toBeInstanceOf(Array);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it("returns empty conversation for lead with no messages", async () => {
      const res = await request(app).get("/api/messages/conversation/lead-3");
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  // ── POST /api/messages/bulk ─────────────────────────────────────────────
  describe("POST /api/messages/bulk", () => {
    it("sends messages to multiple leads", async () => {
      const res = await request(app)
        .post("/api/messages/bulk")
        .send({
          lead_ids: ["lead-1", "lead-2"],
          body: "Bulk outreach message!",
          channel: "sms",
        });
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.sent).toBe(2);
      expect(res.body.failed).toBe(0);
    });

    it("reports failures for invalid lead_ids", async () => {
      const res = await request(app)
        .post("/api/messages/bulk")
        .send({
          lead_ids: ["lead-1", "nonexistent"],
          body: "Test bulk",
        });
      expect(res.status).toBe(201);
      expect(res.body.sent).toBe(1);
      expect(res.body.failed).toBe(1);
    });

    it("rejects empty lead_ids array", async () => {
      const res = await request(app)
        .post("/api/messages/bulk")
        .send({ lead_ids: [], body: "Test" });
      expect(res.status).toBe(400);
    });

    it("rejects missing body", async () => {
      const res = await request(app)
        .post("/api/messages/bulk")
        .send({ lead_ids: ["lead-1"] });
      expect(res.status).toBe(400);
    });
  });
});
