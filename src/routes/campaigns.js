const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/campaigns
router.get("/api/campaigns", requireApiKey, (req, res) => {
  res.json({ campaigns: store.getCampaigns() });
});

// GET /api/campaigns/:id
router.get("/api/campaigns/:id", requireApiKey, (req, res) => {
  const campaign = store.getCampaignById(req.params.id);
  if (!campaign) return res.status(404).json({ ok: false, error: "Campaign not found" });
  res.json(campaign);
});

// POST /api/campaigns
router.post("/api/campaigns", requireApiKey, validate(schemas.createCampaign), (req, res) => {
  const campaign = store.createCampaign(req.body);
  res.status(201).json(campaign);
});

// PUT /api/campaigns/:id
router.put("/api/campaigns/:id", requireApiKey, validate(schemas.updateCampaign), (req, res) => {
  const campaign = store.updateCampaign(req.params.id, req.body);
  if (!campaign) return res.status(404).json({ ok: false, error: "Campaign not found" });
  res.json(campaign);
});

// DELETE /api/campaigns/:id
router.delete("/api/campaigns/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteCampaign(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Campaign not found" });
  res.json({ ok: true });
});

module.exports = router;
