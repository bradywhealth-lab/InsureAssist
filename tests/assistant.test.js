const request = require("supertest");
const { createApp } = require("../src/app");

describe("AI Assistant API", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  // ── POST /api/assistant/chat ──────────────────────────────────────────
  describe("POST /api/assistant/chat", () => {
    it("returns a reply with a conversation_id", async () => {
      const res = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "Help me follow up with my leads" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.reply).toBe("string");
      expect(res.body.reply.length).toBeGreaterThan(0);
      expect(typeof res.body.conversation_id).toBe("string");
      expect(res.body.turn).toBe(1);
    });

    it("continues an existing conversation and increments turn", async () => {
      const first = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "Hello" });
      const convId = first.body.conversation_id;

      const second = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "Tell me about my goals", conversation_id: convId });
      expect(second.body.conversation_id).toBe(convId);
      expect(second.body.turn).toBe(2);
    });

    it("generates a new conversation_id when none is provided", async () => {
      const r1 = await request(app).post("/api/assistant/chat").send({ message: "hi" });
      const r2 = await request(app).post("/api/assistant/chat").send({ message: "hi" });
      expect(r1.body.conversation_id).not.toBe(r2.body.conversation_id);
    });

    it("rejects missing message — 400", async () => {
      const res = await request(app).post("/api/assistant/chat").send({});
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it("rejects empty message — 400", async () => {
      const res = await request(app).post("/api/assistant/chat").send({ message: "" });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/assistant/chat/:id ───────────────────────────────────────
  describe("GET /api/assistant/chat/:id", () => {
    it("returns conversation history", async () => {
      const chat = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "What are my tasks?" });
      const convId = chat.body.conversation_id;

      const res = await request(app).get(`/api/assistant/chat/${convId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBe(2); // user + assistant
      expect(res.body.messages[0].role).toBe("user");
      expect(res.body.messages[1].role).toBe("assistant");
    });

    it("returns empty messages for unknown conversation", async () => {
      const res = await request(app).get("/api/assistant/chat/nonexistent-id");
      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(0);
    });
  });

  // ── DELETE /api/assistant/chat/:id ────────────────────────────────────
  describe("DELETE /api/assistant/chat/:id", () => {
    it("deletes a conversation", async () => {
      const chat = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "Test message" });
      const convId = chat.body.conversation_id;

      const del = await request(app).delete(`/api/assistant/chat/${convId}`);
      expect(del.status).toBe(200);
      expect(del.body.ok).toBe(true);

      const get = await request(app).get(`/api/assistant/chat/${convId}`);
      expect(get.body.messages).toHaveLength(0);
    });

    it("returns 404 for unknown conversation", async () => {
      const res = await request(app).delete("/api/assistant/chat/ghost");
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/assistant/insights ───────────────────────────────────────
  describe("GET /api/assistant/insights", () => {
    it("returns insights string", async () => {
      const res = await request(app).get("/api/assistant/insights");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.insights).toBe("string");
      expect(res.body.insights.length).toBeGreaterThan(0);
    });

    it("includes generated_at timestamp", async () => {
      const res = await request(app).get("/api/assistant/insights");
      expect(new Date(res.body.generated_at).getTime()).not.toBeNaN();
    });
  });

  // ── POST /api/assistant/analyze/lead/:id ─────────────────────────────
  describe("POST /api/assistant/analyze/lead/:id", () => {
    it("returns an analysis for a known lead", async () => {
      const res = await request(app).post("/api/assistant/analyze/lead/lead-1");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.lead_id).toBe("lead-1");
      expect(typeof res.body.analysis).toBe("string");
      expect(res.body.analysis.length).toBeGreaterThan(0);
    });

    it("returns 404 for unknown lead", async () => {
      const res = await request(app).post("/api/assistant/analyze/lead/ghost");
      expect(res.status).toBe(404);
    });
  });

  // ── Tasks ─────────────────────────────────────────────────────────────
  describe("Tasks CRUD", () => {
    it("GET /api/assistant/tasks returns seed tasks", async () => {
      const res = await request(app).get("/api/assistant/tasks");
      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(3);
    });

    it("filters tasks by category", async () => {
      const res = await request(app).get("/api/assistant/tasks?category=personal");
      expect(res.body.tasks.every((t) => t.category === "personal")).toBe(true);
    });

    it("filters tasks by priority", async () => {
      const res = await request(app).get("/api/assistant/tasks?priority=high");
      expect(res.body.tasks.every((t) => t.priority === "high")).toBe(true);
    });

    it("POST creates a business task", async () => {
      const res = await request(app)
        .post("/api/assistant/tasks")
        .send({
          title: "Call Bob Martinez",
          category: "business",
          priority: "high",
          due_date: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Call Bob Martinez");
      expect(res.body.id).toBeDefined();
    });

    it("POST rejects missing category — 400", async () => {
      const res = await request(app)
        .post("/api/assistant/tasks")
        .send({ title: "No category" });
      expect(res.status).toBe(400);
    });

    it("POST rejects invalid priority — 400", async () => {
      const res = await request(app)
        .post("/api/assistant/tasks")
        .send({ title: "Bad priority", category: "business", priority: "urgent" });
      expect(res.status).toBe(400);
    });

    it("PUT updates a task status", async () => {
      const res = await request(app)
        .put("/api/assistant/tasks/task-1")
        .send({ status: "completed" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("completed");
    });

    it("PUT returns 404 for unknown task", async () => {
      const res = await request(app).put("/api/assistant/tasks/ghost").send({ status: "completed" });
      expect(res.status).toBe(404);
    });

    it("DELETE removes a task", async () => {
      const del = await request(app).delete("/api/assistant/tasks/task-3");
      expect(del.status).toBe(200);
      expect(del.body.ok).toBe(true);
      const get = await request(app).get("/api/assistant/tasks");
      expect(get.body.tasks.find((t) => t.id === "task-3")).toBeUndefined();
    });

    it("DELETE returns 404 for unknown task", async () => {
      const res = await request(app).delete("/api/assistant/tasks/ghost");
      expect(res.status).toBe(404);
    });
  });

  // ── Reminders ─────────────────────────────────────────────────────────
  describe("Reminders CRUD", () => {
    it("GET /api/assistant/reminders returns seed reminders", async () => {
      const res = await request(app).get("/api/assistant/reminders");
      expect(res.status).toBe(200);
      expect(res.body.reminders).toHaveLength(2);
    });

    it("POST creates a reminder", async () => {
      const res = await request(app)
        .post("/api/assistant/reminders")
        .send({
          title: "Review pipeline",
          due_at: new Date(Date.now() + 86400000).toISOString(),
          category: "business",
        });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Review pipeline");
    });

    it("POST rejects missing due_at — 400", async () => {
      const res = await request(app)
        .post("/api/assistant/reminders")
        .send({ title: "No due date" });
      expect(res.status).toBe(400);
    });

    it("PUT updates a reminder", async () => {
      const res = await request(app)
        .put("/api/assistant/reminders/reminder-1")
        .send({ title: "Updated title" });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated title");
    });

    it("DELETE removes a reminder", async () => {
      const del = await request(app).delete("/api/assistant/reminders/reminder-2");
      expect(del.status).toBe(200);
      const get = await request(app).get("/api/assistant/reminders");
      expect(get.body.reminders.find((r) => r.id === "reminder-2")).toBeUndefined();
    });
  });

  // ── Goals ─────────────────────────────────────────────────────────────
  describe("Goals CRUD", () => {
    it("GET /api/assistant/goals returns seed goals", async () => {
      const res = await request(app).get("/api/assistant/goals");
      expect(res.status).toBe(200);
      expect(res.body.goals).toHaveLength(3);
    });

    it("filters goals by category", async () => {
      const res = await request(app).get("/api/assistant/goals?category=business");
      expect(res.body.goals.every((g) => g.category === "business")).toBe(true);
    });

    it("POST creates a goal with default progress=0", async () => {
      const res = await request(app)
        .post("/api/assistant/goals")
        .send({
          title: "Get 50 5-star reviews",
          category: "business",
          milestones: ["10 reviews", "25 reviews", "50 reviews"],
        });
      expect(res.status).toBe(201);
      expect(res.body.progress).toBe(0);
      expect(res.body.milestones).toHaveLength(3);
    });

    it("POST rejects missing category — 400", async () => {
      const res = await request(app)
        .post("/api/assistant/goals")
        .send({ title: "No category" });
      expect(res.status).toBe(400);
    });

    it("PUT updates progress", async () => {
      const res = await request(app)
        .put("/api/assistant/goals/goal-1")
        .send({ progress: 50 });
      expect(res.status).toBe(200);
      expect(res.body.progress).toBe(50);
    });

    it("PUT rejects progress > 100 — 400", async () => {
      const res = await request(app)
        .put("/api/assistant/goals/goal-1")
        .send({ progress: 150 });
      expect(res.status).toBe(400);
    });

    it("DELETE removes a goal", async () => {
      const del = await request(app).delete("/api/assistant/goals/goal-3");
      expect(del.status).toBe(200);
      const get = await request(app).get("/api/assistant/goals");
      expect(get.body.goals.find((g) => g.id === "goal-3")).toBeUndefined();
    });
  });
});
