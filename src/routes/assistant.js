const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");
const ai = require("../ai");

const router = Router();

// ── AI Chat ───────────────────────────────────────────────────────────────

/**
 * POST /api/assistant/chat
 *
 * Stateful multi-turn chat. Pass conversation_id to continue a thread;
 * omit it to start a new one (id is returned in the response).
 */
router.post("/api/assistant/chat", requireApiKey, validate(schemas.chat), async (req, res) => {
  try {
    const convId = req.body.conversation_id || uuidv4();
    const history = store.getConversation(convId);

    const userMessage = { role: "user", content: req.body.message };
    const allMessages = [...history, userMessage];

    const reply = await ai.chat(allMessages);
    const assistantMessage = { role: "assistant", content: reply };

    store.appendToConversation(convId, [userMessage, assistantMessage]);

    res.json({
      ok: true,
      conversation_id: convId,
      reply,
      turn: Math.ceil((allMessages.length + 1) / 2),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/assistant/chat/:id — fetch conversation history
router.get("/api/assistant/chat/:id", requireApiKey, (req, res) => {
  const history = store.getConversation(req.params.id);
  res.json({ conversation_id: req.params.id, messages: history });
});

// DELETE /api/assistant/chat/:id — clear a conversation
router.delete("/api/assistant/chat/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteConversation(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Conversation not found" });
  res.json({ ok: true });
});

// ── AI Insights ───────────────────────────────────────────────────────────

/**
 * GET /api/assistant/insights
 *
 * Returns AI-generated business and personal insights based on current CRM data.
 */
router.get("/api/assistant/insights", requireApiKey, async (req, res) => {
  try {
    const context = {
      leads: store.getLeads({ limit: 100 }).data,
      campaigns: store.getCampaigns(),
      tasks: store.getTasks(),
      goals: store.getGoals(),
      social: store.getSocialAnalytics(),
    };
    const insights = await ai.getInsights(context);
    res.json({ ok: true, insights, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Lead Analysis ─────────────────────────────────────────────────────────

/**
 * POST /api/assistant/analyze/lead/:id
 *
 * Returns AI-generated follow-up recommendations for a specific lead.
 */
router.post("/api/assistant/analyze/lead/:id", requireApiKey, async (req, res) => {
  try {
    const lead = store.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
    const analysis = await ai.analyzeLead(lead);
    res.json({ ok: true, lead_id: lead.id, analysis, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Tasks ─────────────────────────────────────────────────────────────────

router.get("/api/assistant/tasks", requireApiKey, (req, res) => {
  const { status, category, priority } = req.query;
  res.json({ tasks: store.getTasks({ status, category, priority }) });
});

router.get("/api/assistant/tasks/:id", requireApiKey, (req, res) => {
  const task = store.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ ok: false, error: "Task not found" });
  res.json(task);
});

router.post("/api/assistant/tasks", requireApiKey, validate(schemas.createTask), (req, res) => {
  const task = store.createTask(req.body);
  res.status(201).json(task);
});

router.put("/api/assistant/tasks/:id", requireApiKey, validate(schemas.updateTask), (req, res) => {
  const task = store.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ ok: false, error: "Task not found" });
  res.json(task);
});

router.delete("/api/assistant/tasks/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Task not found" });
  res.json({ ok: true });
});

// ── Reminders ─────────────────────────────────────────────────────────────

router.get("/api/assistant/reminders", requireApiKey, (req, res) => {
  const { category } = req.query;
  res.json({ reminders: store.getReminders({ category }) });
});

router.get("/api/assistant/reminders/:id", requireApiKey, (req, res) => {
  const reminder = store.getReminderById(req.params.id);
  if (!reminder) return res.status(404).json({ ok: false, error: "Reminder not found" });
  res.json(reminder);
});

router.post("/api/assistant/reminders", requireApiKey, validate(schemas.createReminder), (req, res) => {
  const reminder = store.createReminder(req.body);
  res.status(201).json(reminder);
});

router.put("/api/assistant/reminders/:id", requireApiKey, validate(schemas.updateReminder), (req, res) => {
  const reminder = store.updateReminder(req.params.id, req.body);
  if (!reminder) return res.status(404).json({ ok: false, error: "Reminder not found" });
  res.json(reminder);
});

router.delete("/api/assistant/reminders/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteReminder(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Reminder not found" });
  res.json({ ok: true });
});

// ── Goals ─────────────────────────────────────────────────────────────────

router.get("/api/assistant/goals", requireApiKey, (req, res) => {
  const { category } = req.query;
  res.json({ goals: store.getGoals({ category }) });
});

router.get("/api/assistant/goals/:id", requireApiKey, (req, res) => {
  const goal = store.getGoalById(req.params.id);
  if (!goal) return res.status(404).json({ ok: false, error: "Goal not found" });
  res.json(goal);
});

router.post("/api/assistant/goals", requireApiKey, validate(schemas.createGoal), (req, res) => {
  const goal = store.createGoal(req.body);
  res.status(201).json(goal);
});

router.put("/api/assistant/goals/:id", requireApiKey, validate(schemas.updateGoal), (req, res) => {
  const goal = store.updateGoal(req.params.id, req.body);
  if (!goal) return res.status(404).json({ ok: false, error: "Goal not found" });
  res.json(goal);
});

router.delete("/api/assistant/goals/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteGoal(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Goal not found" });
  res.json({ ok: true });
});

module.exports = router;
