const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

/** Masks a secret string, showing only the last 4 chars. */
function maskSecret(value) {
  if (!value || value.length <= 4) return value ? "****" : "";
  return "*".repeat(value.length - 4) + value.slice(-4);
}

router.get("/api/user/preferences", requireApiKey, (req, res) => {
  const prefs = store.getPreferences();
  // Never return raw API keys in GET responses
  prefs.onlysales_api_key = maskSecret(prefs.onlysales_api_key);
  res.json({ preferences: prefs });
});

router.post(
  "/api/user/preferences",
  requireApiKey,
  validate(schemas.preferences),
  (req, res) => {
    const updated = store.setPreferences(req.body.preferences);
    // Mask the key in the response as well
    const safe = { ...updated, onlysales_api_key: maskSecret(updated.onlysales_api_key) };
    res.json({ ok: true, preferences: safe });
  }
);

module.exports = router;
