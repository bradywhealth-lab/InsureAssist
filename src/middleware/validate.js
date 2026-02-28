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
const CAMPAIGN_STATUSES = ["active", "paused", "completed"];
const PLATFORMS = ["instagram", "facebook", "linkedin", "tiktok"];
const POST_TYPES = ["post", "reel", "story", "carousel"];
const POST_STATUSES = ["draft", "scheduled", "published"];
const TASK_PRIORITIES = ["high", "medium", "low"];
const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"];
const TASK_CATEGORIES = ["business", "personal", "social"];
const RECURRENCES = ["daily", "weekly", "monthly"];
const GOAL_CATEGORIES = ["business", "personal", "social"];
const TONES = ["professional", "casual", "inspirational", "educational", "humorous"];

const schemas = {
  // ── Existing ─────────────────────────────────────────────────────────
  preferences: Joi.object({
    preferences: Joi.object({
      onlysales_enabled: Joi.boolean(),
      onlysales_api_key: Joi.string().allow("").max(256),
      onlysales_api_url: Joi.string().uri().max(512),
      auto_sync_leads: Joi.boolean(),
      auto_analyze_sentiment: Joi.boolean(),
      auto_create_tasks: Joi.boolean(),
    }).required(),
  }),

  createLead: Joi.object({
    name: Joi.string().min(1).max(128).required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    phone: Joi.string().max(32).allow("").default(""),
    status: Joi.string().valid(...LEAD_STATUSES).default("neutral"),
    campaign_id: Joi.string().max(64).allow("").default(""),
  }),

  updateLead: Joi.object({
    name: Joi.string().min(1).max(128),
    email: Joi.string().email({ tlds: { allow: false } }),
    phone: Joi.string().max(32).allow(""),
    status: Joi.string().valid(...LEAD_STATUSES),
    campaign_id: Joi.string().max(64).allow(""),
  }),

  createCampaign: Joi.object({
    name: Joi.string().min(1).max(128).required(),
    status: Joi.string().valid(...CAMPAIGN_STATUSES).default("active"),
  }),

  updateCampaign: Joi.object({
    name: Joi.string().min(1).max(128),
    status: Joi.string().valid(...CAMPAIGN_STATUSES),
  }),

  // ── Social posts ─────────────────────────────────────────────────────
  createSocialPost: Joi.object({
    platforms: Joi.array().items(Joi.string().valid(...PLATFORMS)).min(1).required(),
    type: Joi.string().valid(...POST_TYPES).default("post"),
    status: Joi.string().valid(...POST_STATUSES).default("draft"),
    caption: Joi.string().max(4096).allow("").default(""),
    image_suggestion: Joi.string().max(1024).allow("").default(""),
    image_url: Joi.string().uri().allow(null, "").default(null),
    scheduled_at: Joi.string().isoDate().allow(null, "").default(null),
    tags: Joi.array().items(Joi.string().max(64)).default([]),
  }),

  updateSocialPost: Joi.object({
    platforms: Joi.array().items(Joi.string().valid(...PLATFORMS)).min(1),
    type: Joi.string().valid(...POST_TYPES),
    status: Joi.string().valid(...POST_STATUSES),
    caption: Joi.string().max(4096).allow(""),
    image_suggestion: Joi.string().max(1024).allow(""),
    image_url: Joi.string().uri().allow(null, ""),
    scheduled_at: Joi.string().isoDate().allow(null, ""),
    tags: Joi.array().items(Joi.string().max(64)),
  }),

  generateCaption: Joi.object({
    platform: Joi.string().valid(...PLATFORMS).required(),
    type: Joi.string().valid(...POST_TYPES).default("post"),
    topic: Joi.string().min(1).max(512).required(),
    tone: Joi.string().valid(...TONES).default("professional"),
    include_hashtags: Joi.boolean().default(true),
  }),

  generatePost: Joi.object({
    platforms: Joi.array().items(Joi.string().valid(...PLATFORMS)).min(1).required(),
    type: Joi.string().valid(...POST_TYPES).default("post"),
    topic: Joi.string().min(1).max(512).required(),
    tone: Joi.string().valid(...TONES).default("professional"),
    audience: Joi.string().max(128).default("general"),
  }),

  // ── Tasks ─────────────────────────────────────────────────────────────
  createTask: Joi.object({
    title: Joi.string().min(1).max(256).required(),
    description: Joi.string().max(2048).allow("").default(""),
    priority: Joi.string().valid(...TASK_PRIORITIES).default("medium"),
    status: Joi.string().valid(...TASK_STATUSES).default("pending"),
    category: Joi.string().valid(...TASK_CATEGORIES).required(),
    due_date: Joi.string().isoDate().allow(null, "").default(null),
    lead_id: Joi.string().max(64).allow(null, "").default(null),
    tags: Joi.array().items(Joi.string().max(64)).default([]),
  }),

  updateTask: Joi.object({
    title: Joi.string().min(1).max(256),
    description: Joi.string().max(2048).allow(""),
    priority: Joi.string().valid(...TASK_PRIORITIES),
    status: Joi.string().valid(...TASK_STATUSES),
    category: Joi.string().valid(...TASK_CATEGORIES),
    due_date: Joi.string().isoDate().allow(null, ""),
    lead_id: Joi.string().max(64).allow(null, ""),
    tags: Joi.array().items(Joi.string().max(64)),
  }),

  // ── Reminders ─────────────────────────────────────────────────────────
  createReminder: Joi.object({
    title: Joi.string().min(1).max(256).required(),
    due_at: Joi.string().isoDate().required(),
    recurring: Joi.boolean().default(false),
    recurrence: Joi.string().valid(...RECURRENCES).allow(null, "").default(null),
    category: Joi.string().valid(...TASK_CATEGORIES, "social").default("business"),
  }),

  updateReminder: Joi.object({
    title: Joi.string().min(1).max(256),
    due_at: Joi.string().isoDate(),
    recurring: Joi.boolean(),
    recurrence: Joi.string().valid(...RECURRENCES).allow(null, ""),
    category: Joi.string().valid(...TASK_CATEGORIES, "social"),
  }),

  // ── Goals ─────────────────────────────────────────────────────────────
  createGoal: Joi.object({
    title: Joi.string().min(1).max(256).required(),
    description: Joi.string().max(2048).allow("").default(""),
    target_date: Joi.string().isoDate().allow(null, "").default(null),
    progress: Joi.number().min(0).max(100).default(0),
    category: Joi.string().valid(...GOAL_CATEGORIES).required(),
    milestones: Joi.array().items(Joi.string().max(256)).default([]),
  }),

  updateGoal: Joi.object({
    title: Joi.string().min(1).max(256),
    description: Joi.string().max(2048).allow(""),
    target_date: Joi.string().isoDate().allow(null, ""),
    progress: Joi.number().min(0).max(100),
    category: Joi.string().valid(...GOAL_CATEGORIES),
    milestones: Joi.array().items(Joi.string().max(256)),
  }),

  // ── AI chat ───────────────────────────────────────────────────────────
  chat: Joi.object({
    message: Joi.string().min(1).max(4096).required(),
    conversation_id: Joi.string().max(64).allow(null, "").default(null),
  }),
};

module.exports = { validate, schemas };
