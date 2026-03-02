const request = require("supertest");
const { createApp } = require("../src/app");

const app = createApp();

describe("Tasks & Scheduling API", () => {
  // ── GET /api/tasks ───────────────────────────────────────────────────────
  describe("GET /api/tasks", () => {
    it("returns paginated tasks", async () => {
      const res = await request(app).get("/api/tasks");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by status", async () => {
      const res = await request(app).get("/api/tasks?status=pending");
      expect(res.status).toBe(200);
      for (const task of res.body.data) {
        expect(task.status).toBe("pending");
      }
    });

    it("filters by type", async () => {
      const res = await request(app).get("/api/tasks?type=follow_up");
      expect(res.status).toBe(200);
      for (const task of res.body.data) {
        expect(task.type).toBe("follow_up");
      }
    });

    it("filters by priority", async () => {
      const res = await request(app).get("/api/tasks?priority=high");
      expect(res.status).toBe(200);
      for (const task of res.body.data) {
        expect(task.priority).toBe("high");
      }
    });

    it("sorts by due_date ascending", async () => {
      const res = await request(app).get("/api/tasks");
      const dates = res.body.data.filter((t) => t.due_date).map((t) => new Date(t.due_date));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBe(true);
      }
    });
  });

  // ── GET /api/tasks/daily ────────────────────────────────────────────────
  describe("GET /api/tasks/daily", () => {
    it("returns daily schedule structure", async () => {
      const res = await request(app).get("/api/tasks/daily");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("date");
      expect(res.body).toHaveProperty("tasks");
      expect(res.body.tasks).toBeInstanceOf(Array);
    });

    it("accepts a date parameter", async () => {
      const res = await request(app).get("/api/tasks/daily?date=2024-02-01");
      expect(res.status).toBe(200);
      expect(res.body.date).toBe("2024-02-01");
    });
  });

  // ── GET /api/tasks/:id ──────────────────────────────────────────────────
  describe("GET /api/tasks/:id", () => {
    it("returns a task by id", async () => {
      const res = await request(app).get("/api/tasks/task-1");
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Follow up with Alice Johnson");
      expect(res.body.type).toBe("follow_up");
      expect(res.body.priority).toBe("high");
    });

    it("returns 404 for unknown task", async () => {
      const res = await request(app).get("/api/tasks/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/tasks ─────────────────────────────────────────────────────
  describe("POST /api/tasks", () => {
    it("creates a new task", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({
          title: "Call Bob Martinez",
          description: "Initial outreach call",
          type: "call",
          priority: "high",
          due_date: "2024-03-01T10:00:00.000Z",
          lead_id: "lead-2",
        });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Call Bob Martinez");
      expect(res.body.status).toBe("pending");
      expect(res.body).toHaveProperty("id");
    });

    it("creates appointment task", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({
          title: "Client meeting",
          type: "appointment",
          due_date: "2024-03-15T14:00:00.000Z",
        });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe("appointment");
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ description: "no title" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid task type", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ title: "test", type: "invalid_type" });
      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/tasks/:id ──────────────────────────────────────────────────
  describe("PUT /api/tasks/:id", () => {
    it("updates a task", async () => {
      const res = await request(app)
        .put("/api/tasks/task-1")
        .send({ priority: "urgent" });
      expect(res.status).toBe(200);
      expect(res.body.priority).toBe("urgent");
    });

    it("returns 404 for unknown task", async () => {
      const res = await request(app)
        .put("/api/tasks/nonexistent")
        .send({ title: "test" });
      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/tasks/:id/complete ─────────────────────────────────────────
  describe("PUT /api/tasks/:id/complete", () => {
    it("marks a task as completed", async () => {
      const created = await request(app)
        .post("/api/tasks")
        .send({ title: "Quick task" });
      const res = await request(app).put(`/api/tasks/${created.body.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("completed");
      expect(res.body.completed_at).toBeDefined();
    });

    it("returns 404 for unknown task", async () => {
      const res = await request(app).put("/api/tasks/nonexistent/complete");
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/tasks/:id ───────────────────────────────────────────────
  describe("DELETE /api/tasks/:id", () => {
    it("deletes a task", async () => {
      const created = await request(app)
        .post("/api/tasks")
        .send({ title: "To delete" });
      const res = await request(app).delete(`/api/tasks/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 404 for unknown task", async () => {
      const res = await request(app).delete("/api/tasks/nonexistent");
      expect(res.status).toBe(404);
    });
  });
});
