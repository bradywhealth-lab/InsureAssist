const Joi = require("joi");

/**
 * Returns an Express middleware that validates req[target] against the given
 * Joi schema. Strips unknown keys and collects all errors before responding.
 */
function validate(schema, target = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target] || {}, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }
    req[target] = value;
    next();
  };
}

const LEAD_STATUSES = ["interested", "neutral", "not_interested"];
const LEAD_DISPOSITIONS = [
  "new", "contacted", "qualified", "unqualified", "appointment_set",
  "no_answer", "callback", "sold", "lost", "dnc",
];
const CAMPAIGN_STATUSES = ["active", "paused", "completed"];
const TASK_TYPES = ["follow_up", "call", "appointment", "meeting", "email", "sms", "general"];
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"];
const MESSAGE_DIRECTIONS = ["inbound", "outbound"];
const MESSAGE_CHANNELS = ["sms", "email", "call"];
const MESSAGE_STATUSES = ["queued", "sent", "delivered", "failed", "received"];
const FOLLOWUP_STATUSES = ["active", "paused", "completed", "cancelled"];
const MARKETING_PLATFORMS = ["facebook", "instagram", "twitter", "linkedin", "tiktok", "google", "email", "other"];
const MARKETING_TYPES = ["ad", "post", "story", "reel", "email_blast", "drip", "other"];
const MARKETING_STATUSES = ["draft", "scheduled", "active", "paused", "completed"];
const SCRAPING_TYPES = ["directory", "website", "social", "other"];

const schemas = {
  // ── Preferences ──────────────────────────────────────────────────────────
  preferences: Joi.object({
    preferences: Joi.object({
      onlysales_enabled: Joi.boolean(),
      onlysales_api_key: Joi.string().allow("").max(256),
      onlysales_api_url: Joi.string().uri().max(512),
      auto_sync_leads: Joi.boolean(),
      auto_analyze_sentiment: Joi.boolean(),
      auto_create_tasks: Joi.boolean(),
      auto_followup_enabled: Joi.boolean(),
      followup_delay_hours: Joi.number().integer().min(1).max(720),
      auto_texting_enabled: Joi.boolean(),
      ai_learning_enabled: Joi.boolean(),
      default_lead_disposition: Joi.string().valid(...LEAD_DISPOSITIONS),
      scraping_enabled: Joi.boolean(),
      marketing_auto_post: Joi.boolean(),
    }).required(),
  }),

  // ── Leads ────────────────────────────────────────────────────────────────
  createLead: Joi.object({
    name: Joi.string().min(1).max(128).required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    phone: Joi.string().max(32).allow("").default(""),
    status: Joi.string().valid(...LEAD_STATUSES).default("neutral"),
    disposition: Joi.string().valid(...LEAD_DISPOSITIONS).default("new"),
    campaign_id: Joi.string().max(64).allow("").default(""),
    tags: Joi.array().items(Joi.string().max(64)).default([]),
    notes: Joi.string().max(2048).allow("").default(""),
  }),

  updateLead: Joi.object({
    name: Joi.string().min(1).max(128),
    email: Joi.string().email({ tlds: { allow: false } }),
    phone: Joi.string().max(32).allow(""),
    status: Joi.string().valid(...LEAD_STATUSES),
    disposition: Joi.string().valid(...LEAD_DISPOSITIONS),
    campaign_id: Joi.string().max(64).allow(""),
    tags: Joi.array().items(Joi.string().max(64)),
    notes: Joi.string().max(2048).allow(""),
  }),

  // ── Tags ─────────────────────────────────────────────────────────────────
  createTag: Joi.object({
    name: Joi.string().min(1).max(64).required(),
    color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default("#6b7280"),
  }),

  updateTag: Joi.object({
    name: Joi.string().min(1).max(64),
    color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
  }),

  // ── Contacts ─────────────────────────────────────────────────────────────
  createContact: Joi.object({
    lead_id: Joi.string().max(64).allow("", null).default(null),
    first_name: Joi.string().min(1).max(64).required(),
    last_name: Joi.string().min(1).max(64).required(),
    email: Joi.string().email({ tlds: { allow: false } }).allow("").default(""),
    phone: Joi.string().max(32).allow("").default(""),
    address: Joi.string().max(256).allow("").default(""),
    date_of_birth: Joi.string().max(10).allow("").default(""),
    labels: Joi.array().items(Joi.string().max(64)).default([]),
    custom_fields: Joi.object().pattern(Joi.string(), Joi.string().max(256)).default({}),
    notes: Joi.string().max(2048).allow("").default(""),
  }),

  updateContact: Joi.object({
    lead_id: Joi.string().max(64).allow("", null),
    first_name: Joi.string().min(1).max(64),
    last_name: Joi.string().min(1).max(64),
    email: Joi.string().email({ tlds: { allow: false } }).allow(""),
    phone: Joi.string().max(32).allow(""),
    address: Joi.string().max(256).allow(""),
    date_of_birth: Joi.string().max(10).allow(""),
    labels: Joi.array().items(Joi.string().max(64)),
    custom_fields: Joi.object().pattern(Joi.string(), Joi.string().max(256)),
    notes: Joi.string().max(2048).allow(""),
  }),

  // ── Tasks ────────────────────────────────────────────────────────────────
  createTask: Joi.object({
    title: Joi.string().min(1).max(256).required(),
    description: Joi.string().max(2048).allow("").default(""),
    type: Joi.string().valid(...TASK_TYPES).default("general"),
    priority: Joi.string().valid(...TASK_PRIORITIES).default("medium"),
    status: Joi.string().valid(...TASK_STATUSES).default("pending"),
    due_date: Joi.string().isoDate().allow(null).default(null),
    lead_id: Joi.string().max(64).allow(null).default(null),
    contact_id: Joi.string().max(64).allow(null).default(null),
  }),

  updateTask: Joi.object({
    title: Joi.string().min(1).max(256),
    description: Joi.string().max(2048).allow(""),
    type: Joi.string().valid(...TASK_TYPES),
    priority: Joi.string().valid(...TASK_PRIORITIES),
    status: Joi.string().valid(...TASK_STATUSES),
    due_date: Joi.string().isoDate().allow(null),
    lead_id: Joi.string().max(64).allow(null),
    contact_id: Joi.string().max(64).allow(null),
  }),

  // ── Messages ─────────────────────────────────────────────────────────────
  createMessage: Joi.object({
    lead_id: Joi.string().max(64).allow(null).default(null),
    contact_id: Joi.string().max(64).allow(null).default(null),
    direction: Joi.string().valid(...MESSAGE_DIRECTIONS).default("outbound"),
    channel: Joi.string().valid(...MESSAGE_CHANNELS).default("sms"),
    to: Joi.string().max(128).required(),
    from: Joi.string().max(128).allow("").default(""),
    body: Joi.string().min(1).max(1600).required(),
    status: Joi.string().valid(...MESSAGE_STATUSES).default("queued"),
  }),

  // ── Follow-ups ───────────────────────────────────────────────────────────
  createFollowup: Joi.object({
    lead_id: Joi.string().max(64).required(),
    sequence_name: Joi.string().min(1).max(128).required(),
    total_steps: Joi.number().integer().min(1).max(20).required(),
    actions: Joi.array().items(
      Joi.object({
        step: Joi.number().integer().min(1).required(),
        type: Joi.string().valid("sms", "email", "call").required(),
        template: Joi.string().max(128).required(),
        completed: Joi.boolean().default(false),
        completed_at: Joi.string().isoDate().allow(null).default(null),
      })
    ).min(1).required(),
    next_action_at: Joi.string().isoDate().allow(null).default(null),
  }),

  // ── Scraping ─────────────────────────────────────────────────────────────
  createScrapingJob: Joi.object({
    name: Joi.string().min(1).max(128).required(),
    type: Joi.string().valid(...SCRAPING_TYPES).default("directory"),
    target_url: Joi.string().uri().required(),
    search_query: Joi.string().max(256).allow("").default(""),
    location: Joi.string().max(128).allow("").default(""),
    max_results: Joi.number().integer().min(1).max(500).default(50),
  }),

  // ── Marketing Campaigns ──────────────────────────────────────────────────
  createMarketingCampaign: Joi.object({
    name: Joi.string().min(1).max(128).required(),
    platform: Joi.string().valid(...MARKETING_PLATFORMS).required(),
    type: Joi.string().valid(...MARKETING_TYPES).default("post"),
    content: Joi.string().min(1).max(5000).required(),
    status: Joi.string().valid(...MARKETING_STATUSES).default("draft"),
    schedule: Joi.object({
      frequency: Joi.string().valid("once", "daily", "weekly", "monthly").default("once"),
      time: Joi.string().pattern(/^\d{2}:\d{2}$/).default("09:00"),
      timezone: Joi.string().max(64).default("America/Chicago"),
    }).allow(null).default(null),
  }),

  updateMarketingCampaign: Joi.object({
    name: Joi.string().min(1).max(128),
    platform: Joi.string().valid(...MARKETING_PLATFORMS),
    type: Joi.string().valid(...MARKETING_TYPES),
    content: Joi.string().min(1).max(5000),
    status: Joi.string().valid(...MARKETING_STATUSES),
    schedule: Joi.object({
      frequency: Joi.string().valid("once", "daily", "weekly", "monthly"),
      time: Joi.string().pattern(/^\d{2}:\d{2}$/),
      timezone: Joi.string().max(64),
    }).allow(null),
  }),

  // ── Campaigns (original) ─────────────────────────────────────────────────
  createCampaign: Joi.object({
    name: Joi.string().min(1).max(128).required(),
    status: Joi.string().valid(...CAMPAIGN_STATUSES).default("active"),
  }),

  updateCampaign: Joi.object({
    name: Joi.string().min(1).max(128),
    status: Joi.string().valid(...CAMPAIGN_STATUSES),
  }),
};

module.exports = { validate, schemas };
