const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/marketing — list all marketing campaigns, filterable by platform/status
router.get("/api/marketing", requireApiKey, (req, res) => {
  const { platform, status } = req.query;
  const campaigns = store.getMarketingCampaigns({ platform, status });
  res.json({ campaigns, count: campaigns.length });
});

// GET /api/marketing/:id
router.get("/api/marketing/:id", requireApiKey, (req, res) => {
  const campaign = store.getMarketingCampaignById(req.params.id);
  if (!campaign) return res.status(404).json({ ok: false, error: "Marketing campaign not found" });
  res.json(campaign);
});

// POST /api/marketing — create a new marketing campaign
router.post("/api/marketing", requireApiKey, validate(schemas.createMarketingCampaign), (req, res) => {
  const campaign = store.createMarketingCampaign(req.body);
  res.status(201).json(campaign);
});

// PUT /api/marketing/:id
router.put("/api/marketing/:id", requireApiKey, validate(schemas.updateMarketingCampaign), (req, res) => {
  const campaign = store.updateMarketingCampaign(req.params.id, req.body);
  if (!campaign) return res.status(404).json({ ok: false, error: "Marketing campaign not found" });
  res.json(campaign);
});

// PUT /api/marketing/:id/activate — quick-activate shortcut
router.put("/api/marketing/:id/activate", requireApiKey, (req, res) => {
  const campaign = store.updateMarketingCampaign(req.params.id, { status: "active" });
  if (!campaign) return res.status(404).json({ ok: false, error: "Marketing campaign not found" });
  res.json(campaign);
});

// PUT /api/marketing/:id/pause — quick-pause shortcut
router.put("/api/marketing/:id/pause", requireApiKey, (req, res) => {
  const campaign = store.updateMarketingCampaign(req.params.id, { status: "paused" });
  if (!campaign) return res.status(404).json({ ok: false, error: "Marketing campaign not found" });
  res.json(campaign);
});

// DELETE /api/marketing/:id
router.delete("/api/marketing/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteMarketingCampaign(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Marketing campaign not found" });
  res.json({ ok: true });
});

module.exports = router;
