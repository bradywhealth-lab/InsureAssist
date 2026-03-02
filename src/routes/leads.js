const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/leads — paginated, filterable by status, campaign_id, disposition, or tag
router.get("/api/leads", requireApiKey, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10", 10)));
  const { status, campaign_id, disposition, tag } = req.query;
  res.json(store.getLeads({ page, limit, status, campaign_id, disposition, tag }));
});

// GET /api/leads/:id
router.get("/api/leads/:id", requireApiKey, (req, res) => {
  const lead = store.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json(lead);
});

// POST /api/leads
router.post("/api/leads", requireApiKey, validate(schemas.createLead), (req, res) => {
  const lead = store.createLead(req.body);
  res.status(201).json(lead);
});

// PUT /api/leads/:id
router.put("/api/leads/:id", requireApiKey, validate(schemas.updateLead), (req, res) => {
  const lead = store.updateLead(req.params.id, req.body);
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json(lead);
});

// DELETE /api/leads/:id
router.delete("/api/leads/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteLead(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json({ ok: true });
});

// Legacy OnlySales public mock endpoint — no auth required
router.get(["/leads", "/v1/leads"], (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "1", 10)));
  const { data } = store.getLeads({ limit });
  res.json({ data });
});

module.exports = router;
