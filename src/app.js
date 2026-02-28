const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const { standard } = require("./middleware/rateLimiter");

const healthRouter = require("./routes/health");
const authRouter = require("./routes/auth");
const preferencesRouter = require("./routes/preferences");
const leadsRouter = require("./routes/leads");
const campaignsRouter = require("./routes/campaigns");
const integrationsRouter = require("./routes/integrations");

function createApp() {
  const app = express();

  // ── Security headers (helmet) ────────────────────────────────────────────
  app.use(helmet());

  // ── Body parsing with hard size cap ─────────────────────────────────────
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  // ── Request ID (aids tracing / debugging) ────────────────────────────────
  app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader("X-Request-Id", req.id);
    next();
  });

  // ── Structured request logging (silent in test) ──────────────────────────
  if (process.env.NODE_ENV !== "test") {
    app.use(
      morgan(":method :url :status :res[content-length] - :response-time ms [:date[clf]]")
    );
  }

  // ── CORS ─────────────────────────────────────────────────────────────────
  // Configurable via CORS_ORIGIN env var (comma-separated); defaults to *.
  app.use((req, res, next) => {
    const allowed = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["*"];
    const origin = req.headers.origin;
    if (allowed.includes("*")) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (origin && allowed.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Expose-Headers", "X-Request-Id, X-RateLimit-Limit, X-RateLimit-Remaining");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // ── Global rate limiter ──────────────────────────────────────────────────
  app.use(standard);

  // ── Routes ───────────────────────────────────────────────────────────────
  app.use(healthRouter);
  app.use(authRouter);
  app.use(preferencesRouter);
  app.use(leadsRouter);
  app.use(campaignsRouter);
  app.use(integrationsRouter);

  // ── 404 catch-all ────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: `Route ${req.method} ${req.path} not found` });
  });

  // ── Global error handler ─────────────────────────────────────────────────
  app.use((err, req, res, _next) => {
    if (err.type === "entity.too.large") {
      return res.status(413).json({ ok: false, error: "Payload too large" });
    }
    console.error(`[${req.id}] Unhandled error:`, err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
