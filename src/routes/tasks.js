const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/tasks — paginated, filterable
router.get("/api/tasks", requireApiKey, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const { status, type, priority, due_before, due_after } = req.query;
  res.json(store.getTasks({ page, limit, status, type, priority, due_before, due_after }));
});

// GET /api/tasks/daily — daily schedule view
router.get("/api/tasks/daily", requireApiKey, (req, res) => {
  const { date } = req.query;
  res.json(store.getDailySchedule(date));
});

// GET /api/tasks/:id
router.get("/api/tasks/:id", requireApiKey, (req, res) => {
  const task = store.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ ok: false, error: "Task not found" });
  res.json(task);
});

// POST /api/tasks
router.post("/api/tasks", requireApiKey, validate(schemas.createTask), (req, res) => {
  const task = store.createTask(req.body);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put("/api/tasks/:id", requireApiKey, validate(schemas.updateTask), (req, res) => {
  const task = store.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ ok: false, error: "Task not found" });
  res.json(task);
});

// PUT /api/tasks/:id/complete — quick-complete shortcut
router.put("/api/tasks/:id/complete", requireApiKey, (req, res) => {
  const task = store.updateTask(req.params.id, { status: "completed" });
  if (!task) return res.status(404).json({ ok: false, error: "Task not found" });
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete("/api/tasks/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Task not found" });
  res.json({ ok: true });
});

module.exports = router;
