const crypto = require("crypto");

/**
 * Optional API key authentication.
 *
 * Enabled only when the API_KEY environment variable is set.
 * Accepts the key via:
 *   - X-API-Key header
 *   - Authorization: Bearer <key> header
 *
 * When API_KEY is not set, all requests pass through (dev-friendly default).
 * Uses timing-safe comparison to prevent timing attacks on the key.
 */
function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next(); // auth disabled

  const fromHeader = req.headers["x-api-key"];
  const authHeader = req.headers.authorization || "";
  const fromBearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const provided = fromHeader || fromBearer;

  if (!provided || !timingSafeEqual(provided, apiKey)) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized: invalid or missing API key",
    });
  }
  next();
}

/** Constant-time string comparison to prevent timing side-channel attacks. */
function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { requireApiKey };
