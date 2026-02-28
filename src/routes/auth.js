const { Router } = require("express");
const crypto = require("crypto");
const { strict } = require("../middleware/rateLimiter");

const router = Router();

/**
 * POST /api/auth/token
 *
 * Mock auth endpoint. Returns a separate session token — never the raw API_KEY.
 * Rate-limited strictly to discourage brute-force.
 */
router.post("/api/auth/token", strict, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "username and password are required" });
  }
  // Return a random session token rather than the real API key
  const token = process.env.API_KEY
    ? crypto.randomBytes(24).toString("hex")
    : "mock-dev-token";
  return res.json({
    ok: true,
    token,
    expires_in: 3600,
  });
});

module.exports = router;
