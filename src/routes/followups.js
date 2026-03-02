const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/followups — list all follow-up sequences
router.get("/api/followups", requireApiKey, (req, res) => {
  const { lead_id, status } = req.query;
  const followups = store.getFollowups({ lead_id, status });
  res.json({ followups, count: followups.length });
});

// GET /api/followups/:id
router.get("/api/followups/:id", requireApiKey, (req, res) => {
  const followup = store.getFollowupById(req.params.id);
  if (!followup) return res.status(404).json({ ok: false, error: "Follow-up sequence not found" });
  res.json(followup);
});

// POST /api/followups — create a new follow-up sequence
router.post("/api/followups", requireApiKey, validate(schemas.createFollowup), (req, res) => {
  const followup = store.createFollowup(req.body);
  res.status(201).json(followup);
});

// PUT /api/followups/:id/advance — advance to the next step
router.put("/api/followups/:id/advance", requireApiKey, (req, res) => {
  const followup = store.advanceFollowup(req.params.id);
  if (!followup) return res.status(404).json({ ok: false, error: "Follow-up sequence not found" });
  res.json(followup);
});

// PUT /api/followups/:id/pause — pause the sequence
router.put("/api/followups/:id/pause", requireApiKey, (req, res) => {
  const followup = store.pauseFollowup(req.params.id);
  if (!followup) return res.status(404).json({ ok: false, error: "Follow-up sequence not found" });
  res.json(followup);
});

// PUT /api/followups/:id/resume — resume the sequence
router.put("/api/followups/:id/resume", requireApiKey, (req, res) => {
  const followup = store.resumeFollowup(req.params.id);
  if (!followup) return res.status(404).json({ ok: false, error: "Follow-up sequence not found" });
  res.json(followup);
});

// DELETE /api/followups/:id
router.delete("/api/followups/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteFollowup(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Follow-up sequence not found" });
  res.json({ ok: true });
});

module.exports = router;
