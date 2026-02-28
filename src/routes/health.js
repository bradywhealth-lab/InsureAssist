const { Router } = require("express");

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

module.exports = router;
