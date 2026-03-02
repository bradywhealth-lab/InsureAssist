const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/messages — paginated, filterable
router.get("/api/messages", requireApiKey, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const { lead_id, contact_id, direction, channel } = req.query;
  res.json(store.getMessages({ page, limit, lead_id, contact_id, direction, channel }));
});

// GET /api/messages/:id
router.get("/api/messages/:id", requireApiKey, (req, res) => {
  const message = store.getMessageById(req.params.id);
  if (!message) return res.status(404).json({ ok: false, error: "Message not found" });
  res.json(message);
});

// POST /api/messages — send a text/message
router.post("/api/messages", requireApiKey, validate(schemas.createMessage), (req, res) => {
  const message = store.createMessage(req.body);
  res.status(201).json(message);
});

// GET /api/messages/conversation/:leadId — get full conversation thread for a lead
router.get("/api/messages/conversation/:leadId", requireApiKey, (req, res) => {
  const conversation = store.getConversation(req.params.leadId);
  res.json({ lead_id: req.params.leadId, messages: conversation, count: conversation.length });
});

// POST /api/messages/bulk — send to multiple leads at once
router.post("/api/messages/bulk", requireApiKey, (req, res) => {
  const { lead_ids, body, channel } = req.body;
  if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
    return res.status(400).json({ ok: false, error: "lead_ids must be a non-empty array" });
  }
  if (!body || typeof body !== "string") {
    return res.status(400).json({ ok: false, error: "body is required" });
  }

  const results = [];
  for (const leadId of lead_ids) {
    const lead = store.getLeadById(leadId);
    if (!lead) {
      results.push({ lead_id: leadId, ok: false, error: "Lead not found" });
      continue;
    }
    const message = store.createMessage({
      lead_id: leadId,
      to: lead.phone || lead.email,
      body,
      channel: channel || "sms",
      direction: "outbound",
    });
    results.push({ lead_id: leadId, ok: true, message_id: message.id });
  }
  res.status(201).json({ ok: true, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
});

module.exports = router;
