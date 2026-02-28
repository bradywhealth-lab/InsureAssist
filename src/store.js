const { v4: uuidv4 } = require("uuid");

// ── Preferences ────────────────────────────────────────────────────────────
const DEFAULT_PREFERENCES = {
  onlysales_enabled: false,
  onlysales_api_key: "",
  onlysales_api_url: "http://localhost:3001",
  auto_sync_leads: true,
  auto_analyze_sentiment: true,
  auto_create_tasks: true,
};

let preferences = { ...DEFAULT_PREFERENCES };

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_LEADS = [
  {
    id: "lead-1",
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+1-555-0101",
    status: "interested",
    campaign_id: "camp-1",
    created_at: new Date("2024-01-10").toISOString(),
  },
  {
    id: "lead-2",
    name: "Bob Martinez",
    email: "bob@example.com",
    phone: "+1-555-0102",
    status: "neutral",
    campaign_id: "camp-1",
    created_at: new Date("2024-01-11").toISOString(),
  },
  {
    id: "lead-3",
    name: "Carol Smith",
    email: "carol@example.com",
    phone: "+1-555-0103",
    status: "not_interested",
    campaign_id: "camp-2",
    created_at: new Date("2024-01-12").toISOString(),
  },
];

const SEED_CAMPAIGNS = [
  {
    id: "camp-1",
    name: "Welcome Campaign",
    status: "active",
    lead_count: 2,
    created_at: new Date("2024-01-01").toISOString(),
  },
  {
    id: "camp-2",
    name: "Follow Up",
    status: "active",
    lead_count: 1,
    created_at: new Date("2024-01-05").toISOString(),
  },
];

let leads = SEED_LEADS.map((l) => ({ ...l }));
let campaigns = SEED_CAMPAIGNS.map((c) => ({ ...c }));

// ── Store API ──────────────────────────────────────────────────────────────
const store = {
  // Preferences
  getPreferences() {
    return { ...preferences };
  },
  setPreferences(updates) {
    preferences = { ...preferences, ...updates };
    return { ...preferences };
  },

  // Leads
  getLeads({ page = 1, limit = 10, status, campaign_id } = {}) {
    let filtered = leads.slice();
    if (status) filtered = filtered.filter((l) => l.status === status);
    if (campaign_id) filtered = filtered.filter((l) => l.campaign_id === campaign_id);
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  },
  getLeadById(id) {
    return leads.find((l) => l.id === id) || null;
  },
  createLead(data) {
    const lead = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
    leads.push(lead);
    return { ...lead };
  },
  updateLead(id, data) {
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    leads[idx] = { ...leads[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...leads[idx] };
  },
  deleteLead(id) {
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    leads.splice(idx, 1);
    return true;
  },

  // Campaigns
  getCampaigns() {
    return campaigns.map((c) => ({ ...c }));
  },
  getCampaignById(id) {
    const c = campaigns.find((c) => c.id === id);
    return c ? { ...c } : null;
  },
  createCampaign(data) {
    const campaign = {
      id: uuidv4(),
      lead_count: 0,
      ...data,
      created_at: new Date().toISOString(),
    };
    campaigns.push(campaign);
    return { ...campaign };
  },
  updateCampaign(id, data) {
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    campaigns[idx] = { ...campaigns[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...campaigns[idx] };
  },
  deleteCampaign(id) {
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    campaigns.splice(idx, 1);
    return true;
  },

  // Analytics
  getAnalytics() {
    const statusCounts = leads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    return {
      total_leads: leads.length,
      total_campaigns: campaigns.length,
      synced: 42,
      sms_today: 5,
      sentiment_breakdown: Object.entries(statusCounts).map(([sentiment, count]) => ({
        sentiment,
        count,
      })),
      campaigns: campaigns.map((c) => ({ id: c.id, name: c.name })),
    };
  },

  // Reset to seed state (used by tests)
  _reset() {
    preferences = { ...DEFAULT_PREFERENCES };
    leads = SEED_LEADS.map((l) => ({ ...l }));
    campaigns = SEED_CAMPAIGNS.map((c) => ({ ...c }));
  },
};

module.exports = store;
