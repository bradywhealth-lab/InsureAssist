const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/tags — list all tags
router.get("/api/tags", requireApiKey, (req, res) => {
  res.json({ tags: store.getTags() });
});

// GET /api/tags/:id
router.get("/api/tags/:id", requireApiKey, (req, res) => {
  const tag = store.getTagById(req.params.id);
  if (!tag) return res.status(404).json({ ok: false, error: "Tag not found" });
  res.json(tag);
});

// POST /api/tags
router.post("/api/tags", requireApiKey, validate(schemas.createTag), (req, res) => {
  const tag = store.createTag(req.body);
  res.status(201).json(tag);
});

// PUT /api/tags/:id
router.put("/api/tags/:id", requireApiKey, validate(schemas.updateTag), (req, res) => {
  const tag = store.updateTag(req.params.id, req.body);
  if (!tag) return res.status(404).json({ ok: false, error: "Tag not found" });
  res.json(tag);
});

// DELETE /api/tags/:id
router.delete("/api/tags/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteTag(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Tag not found" });
  res.json({ ok: true });
});

// POST /api/leads/:id/tags — add a tag to a lead
router.post("/api/leads/:id/tags", requireApiKey, (req, res) => {
  const { tag } = req.body;
  if (!tag || typeof tag !== "string") {
    return res.status(400).json({ ok: false, error: "Missing required field: tag" });
  }
  const lead = store.addTagToLead(req.params.id, tag);
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json(lead);
});

// DELETE /api/leads/:id/tags/:tagName — remove a tag from a lead
router.delete("/api/leads/:id/tags/:tagName", requireApiKey, (req, res) => {
  const lead = store.removeTagFromLead(req.params.id, req.params.tagName);
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json(lead);
});

// PUT /api/leads/:id/disposition — set lead disposition
router.put("/api/leads/:id/disposition", requireApiKey, (req, res) => {
  const { disposition } = req.body;
  const validDispositions = [
    "new", "contacted", "qualified", "unqualified", "appointment_set",
    "no_answer", "callback", "sold", "lost", "dnc",
  ];
  if (!disposition || !validDispositions.includes(disposition)) {
    return res.status(400).json({
      ok: false,
      error: `Invalid disposition. Must be one of: ${validDispositions.join(", ")}`,
    });
  }
  const lead = store.setLeadDisposition(req.params.id, disposition);
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json(lead);
});

module.exports = router;
