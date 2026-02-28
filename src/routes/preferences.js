const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

router.get("/api/user/preferences", requireApiKey, (req, res) => {
  res.json({ preferences: store.getPreferences() });
});

router.post(
  "/api/user/preferences",
  requireApiKey,
  validate(schemas.preferences),
  (req, res) => {
    const updated = store.setPreferences(req.body.preferences);
    res.json({ ok: true, preferences: updated });
  }
);

module.exports = router;
