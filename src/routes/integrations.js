const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const store = require("../store");

const router = Router();

// GET /api/integrations/onlysales/sync — sync stats used by UI dashboard
router.get("/api/integrations/onlysales/sync", requireApiKey, (req, res) => {
  res.json(store.getAnalytics());
});

// GET /api/integrations/onlysales/status — connection health
router.get("/api/integrations/onlysales/status", requireApiKey, (req, res) => {
  const prefs = store.getPreferences();
  res.json({
    connected: prefs.onlysales_enabled && prefs.onlysales_api_key !== "",
    api_url: prefs.onlysales_api_url,
    last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  });
});

// POST /api/integrations/onlysales/webhook
router.post("/api/integrations/onlysales/webhook", requireApiKey, (req, res) => {
  console.log("Received OnlySales webhook:", JSON.stringify(req.body));
  res.json({ ok: true });
});

// GET /api/analytics — full analytics rollup
router.get("/api/analytics", requireApiKey, (req, res) => {
  res.json(store.getAnalytics());
});

module.exports = router;
