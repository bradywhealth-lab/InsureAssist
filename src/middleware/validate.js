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

const schemas = {
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
};

module.exports = { validate, schemas };
