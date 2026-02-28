const { Router } = require("express");
const { strict } = require("../middleware/rateLimiter");

const router = Router();

/**
 * POST /api/auth/token
 *
 * Mock auth endpoint. Any username/password returns a token equal to the
 * configured API_KEY (or "mock-dev-token" when auth is disabled).
 * Rate-limited strictly to discourage brute-force in dev environments.
 */
router.post("/api/auth/token", strict, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "username and password are required" });
  }
  return res.json({
    ok: true,
    token: process.env.API_KEY || "mock-dev-token",
    expires_in: 3600,
  });
});

module.exports = router;
