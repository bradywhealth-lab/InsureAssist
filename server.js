const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Simple CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// In-memory preferences store
let preferences = {
  onlysales_enabled: false,
  onlysales_api_key: "",
  onlysales_api_url: "http://localhost:3001",
  auto_sync_leads: true,
  auto_analyze_sentiment: true,
  auto_create_tasks: true,
};

// GET user preferences
app.get("/api/user/preferences", (req, res) => {
  res.json({ preferences });
});

// POST user preferences (save)
app.post("/api/user/preferences", (req, res) => {
  try {
    const body = req.body;
    if (body && body.preferences) {
      preferences = { ...preferences, ...body.preferences };
      return res.json({ ok: true, preferences });
    }
    return res.status(400).json({ ok: false, error: "Missing preferences" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Sync/stats endpoint used by the UI to show integration stats
app.get("/api/integrations/onlysales/sync", (req, res) => {
  const stats = {
    synced: 42,
    total: 100,
    sms_today: 5,
    campaigns: [
      { id: 1, name: "Welcome Campaign" },
      { id: 2, name: "Follow Up" },
    ],
    sentiment_breakdown: [
      { sentiment: "interested", count: 3 },
      { sentiment: "neutral", count: 10 },
      { sentiment: "not_interested", count: 2 },
    ],
  };
  res.json(stats);
});

// Webhook receiver
app.post("/api/integrations/onlysales/webhook", (req, res) => {
  console.log("Received OnlySales webhook:", JSON.stringify(req.body));
  // Acknowledge receipt
  res.json({ ok: true });
});

// OnlySales public API mock for /leads used by testConnection
app.get(["/leads", "/v1/leads"], (req, res) => {
  const limit = parseInt(req.query.limit || "1", 10);
  const leads = [];
  for (let i = 0; i < limit; i++) {
    leads.push({ id: i + 1, name: `Lead ${i + 1}` });
  }
  res.json({ data: leads });
});

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`Mock API server listening on http://localhost:${port}`);
});
