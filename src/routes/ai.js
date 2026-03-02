const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const store = require("../store");

const router = Router();

// GET /api/ai/insights — list all AI insights, filterable by lead_id or type
router.get("/api/ai/insights", requireApiKey, (req, res) => {
  const { lead_id, type } = req.query;
  const insights = store.getAiInsights({ lead_id, type });
  res.json({ insights, count: insights.length });
});

// GET /api/ai/insights/:id
router.get("/api/ai/insights/:id", requireApiKey, (req, res) => {
  const insight = store.getAiInsightById(req.params.id);
  if (!insight) return res.status(404).json({ ok: false, error: "AI insight not found" });
  res.json(insight);
});

// POST /api/ai/score/:leadId — generate AI lead score for a specific lead
router.post("/api/ai/score/:leadId", requireApiKey, (req, res) => {
  const insight = store.generateLeadScore(req.params.leadId);
  if (!insight) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.status(201).json(insight);
});

// POST /api/ai/score-all — generate AI scores for all leads
router.post("/api/ai/score-all", requireApiKey, (req, res) => {
  const allLeads = store.getAllLeads();
  const insights = [];
  for (const lead of allLeads) {
    const insight = store.generateLeadScore(lead.id);
    if (insight) insights.push(insight);
  }
  res.status(201).json({
    ok: true,
    scored: insights.length,
    insights,
  });
});

// GET /api/ai/recommendations/:leadId — get AI recommendations for a lead
router.get("/api/ai/recommendations/:leadId", requireApiKey, (req, res) => {
  const lead = store.getLeadById(req.params.leadId);
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });

  // Generate contextual recommendations based on lead state
  const recommendations = [];

  if (lead.disposition === "new") {
    recommendations.push({ action: "send_intro_text", priority: "high", message: "Send an introduction text within 5 minutes of receiving this lead" });
  }
  if (lead.disposition === "contacted" && lead.status === "interested") {
    recommendations.push({ action: "schedule_call", priority: "high", message: "Lead is interested — schedule a discovery call" });
  }
  if (lead.disposition === "qualified") {
    recommendations.push({ action: "set_appointment", priority: "urgent", message: "Qualified lead — book an appointment immediately" });
  }
  if (lead.disposition === "no_answer") {
    recommendations.push({ action: "retry_contact", priority: "medium", message: "Try calling again at a different time of day" });
    recommendations.push({ action: "send_text", priority: "medium", message: "Send a follow-up text: 'Hi, tried reaching you earlier...'" });
  }
  if (lead.disposition === "callback") {
    recommendations.push({ action: "schedule_callback", priority: "high", message: "Create a task to call back at the requested time" });
  }
  if (!lead.tags || lead.tags.length === 0) {
    recommendations.push({ action: "add_tags", priority: "low", message: "Tag this lead for better organization and filtering" });
  }
  if (!lead.last_contacted_at) {
    recommendations.push({ action: "initiate_outreach", priority: "high", message: "This lead has never been contacted — start outreach now" });
  }

  res.json({
    lead_id: req.params.leadId,
    lead_name: lead.name,
    disposition: lead.disposition,
    recommendations,
  });
});

// GET /api/ai/dashboard — AI-powered dashboard summary
router.get("/api/ai/dashboard", requireApiKey, (req, res) => {
  const analytics = store.getAnalytics();
  const allLeads = store.getAllLeads();
  const tasks = store.getTasks({ status: "pending" });

  const hotLeads = allLeads.filter((l) => l.status === "interested" && l.disposition !== "sold");
  const untouched = allLeads.filter((l) => !l.last_contacted_at);
  const followups = store.getFollowups({ status: "active" });

  res.json({
    summary: {
      total_leads: analytics.total_leads,
      hot_leads: hotLeads.length,
      untouched_leads: untouched.length,
      pending_tasks: analytics.pending_tasks,
      active_followups: followups.length,
      messages_today: analytics.messages_today,
    },
    action_items: [
      ...(untouched.length > 0 ? [{ type: "outreach", message: `${untouched.length} leads have never been contacted`, priority: "high" }] : []),
      ...(hotLeads.length > 0 ? [{ type: "close", message: `${hotLeads.length} hot leads ready for next step`, priority: "urgent" }] : []),
      ...(tasks.total > 0 ? [{ type: "tasks", message: `${tasks.total} pending tasks need attention`, priority: "medium" }] : []),
      ...(followups.length > 0 ? [{ type: "followups", message: `${followups.length} active follow-up sequences running`, priority: "low" }] : []),
    ],
    hot_leads: hotLeads.slice(0, 5).map((l) => ({ id: l.id, name: l.name, disposition: l.disposition })),
  });
});

module.exports = router;
