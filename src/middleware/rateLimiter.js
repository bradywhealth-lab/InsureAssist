const rateLimit = require("express-rate-limit");

// Skip rate-limiting in test environment so test suites don't hit limits
const skip = () => process.env.NODE_ENV === "test";

// General-purpose limiter: 100 req / 15 min per IP
const standard = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests, please try again later." },
});

// Strict limiter for sensitive endpoints (auth): 10 req / 15 min per IP
const strict = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests on this endpoint, please slow down." },
});

module.exports = { standard, strict };
