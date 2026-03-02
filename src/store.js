const { v4: uuidv4 } = require("uuid");

// ── Preferences ────────────────────────────────────────────────────────────
const DEFAULT_PREFERENCES = {
  onlysales_enabled: false,
  onlysales_api_key: "",
  onlysales_api_url: "http://localhost:3001",
  auto_sync_leads: true,
  auto_analyze_sentiment: true,
  auto_create_tasks: true,
  // New CRM preferences
  auto_followup_enabled: true,
  followup_delay_hours: 24,
  auto_texting_enabled: false,
  ai_learning_enabled: true,
  default_lead_disposition: "new",
  scraping_enabled: false,
  marketing_auto_post: false,
};

let preferences = { ...DEFAULT_PREFERENCES };

// ── Lead Statuses & Dispositions ────────────────────────────────────────────
const LEAD_STATUSES = ["interested", "neutral", "not_interested"];
const LEAD_DISPOSITIONS = [
  "new", "contacted", "qualified", "unqualified", "appointment_set",
  "no_answer", "callback", "sold", "lost", "dnc",
];

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_LEADS = [
  {
    id: "lead-1",
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+1-555-0101",
    status: "interested",
    disposition: "qualified",
    campaign_id: "camp-1",
    tags: ["hot-lead", "referral"],
    csv_source: { filename: "january_leads.csv", uploaded_at: new Date("2024-01-10").toISOString() },
    notes: "Very interested in whole life policy",
    last_contacted_at: new Date("2024-01-15").toISOString(),
    created_at: new Date("2024-01-10").toISOString(),
  },
  {
    id: "lead-2",
    name: "Bob Martinez",
    email: "bob@example.com",
    phone: "+1-555-0102",
    status: "neutral",
    disposition: "contacted",
    campaign_id: "camp-1",
    tags: ["cold-lead"],
    csv_source: { filename: "january_leads.csv", uploaded_at: new Date("2024-01-10").toISOString() },
    notes: "",
    last_contacted_at: null,
    created_at: new Date("2024-01-11").toISOString(),
  },
  {
    id: "lead-3",
    name: "Carol Smith",
    email: "carol@example.com",
    phone: "+1-555-0103",
    status: "not_interested",
    disposition: "lost",
    campaign_id: "camp-2",
    tags: ["dnc"],
    csv_source: { filename: "february_leads.csv", uploaded_at: new Date("2024-02-01").toISOString() },
    notes: "Do not contact again",
    last_contacted_at: new Date("2024-02-05").toISOString(),
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

const SEED_TAGS = [
  { id: "tag-1", name: "hot-lead", color: "#ef4444", created_at: new Date("2024-01-01").toISOString() },
  { id: "tag-2", name: "cold-lead", color: "#3b82f6", created_at: new Date("2024-01-01").toISOString() },
  { id: "tag-3", name: "referral", color: "#22c55e", created_at: new Date("2024-01-01").toISOString() },
  { id: "tag-4", name: "dnc", color: "#6b7280", created_at: new Date("2024-01-01").toISOString() },
  { id: "tag-5", name: "callback", color: "#f59e0b", created_at: new Date("2024-01-01").toISOString() },
  { id: "tag-6", name: "appointment-set", color: "#8b5cf6", created_at: new Date("2024-01-01").toISOString() },
];

const SEED_CONTACTS = [
  {
    id: "contact-1",
    lead_id: "lead-1",
    first_name: "Alice",
    last_name: "Johnson",
    email: "alice@example.com",
    phone: "+1-555-0101",
    address: "123 Main St, Austin, TX 78701",
    date_of_birth: "1985-03-15",
    labels: ["VIP", "life-insurance"],
    csv_source: { filename: "january_leads.csv", uploaded_at: new Date("2024-01-10").toISOString() },
    custom_fields: { preferred_contact: "phone", best_time: "morning" },
    notes: "Prefers morning calls. Interested in whole life.",
    created_at: new Date("2024-01-10").toISOString(),
  },
];

const SEED_TASKS = [
  {
    id: "task-1",
    title: "Follow up with Alice Johnson",
    description: "Call about whole life policy options",
    type: "follow_up",
    priority: "high",
    status: "pending",
    due_date: new Date("2024-02-01").toISOString(),
    lead_id: "lead-1",
    contact_id: "contact-1",
    completed_at: null,
    created_at: new Date("2024-01-20").toISOString(),
  },
  {
    id: "task-2",
    title: "Team sync meeting",
    description: "Weekly pipeline review",
    type: "appointment",
    priority: "medium",
    status: "pending",
    due_date: new Date("2024-02-02T10:00:00Z").toISOString(),
    lead_id: null,
    contact_id: null,
    completed_at: null,
    created_at: new Date("2024-01-20").toISOString(),
  },
];

const SEED_MESSAGES = [
  {
    id: "msg-1",
    lead_id: "lead-1",
    contact_id: "contact-1",
    direction: "outbound",
    channel: "sms",
    to: "+1-555-0101",
    from: "+1-555-9999",
    body: "Hi Alice! Just following up on your interest in life insurance options. Would you like to schedule a call this week?",
    status: "delivered",
    sent_at: new Date("2024-01-15").toISOString(),
    created_at: new Date("2024-01-15").toISOString(),
  },
];

const SEED_FOLLOWUPS = [
  {
    id: "followup-1",
    lead_id: "lead-1",
    sequence_name: "New Lead Nurture",
    step: 1,
    total_steps: 5,
    status: "active",
    next_action_at: new Date("2024-02-01").toISOString(),
    last_action_at: new Date("2024-01-15").toISOString(),
    actions: [
      { step: 1, type: "sms", template: "intro_text", completed: true, completed_at: new Date("2024-01-15").toISOString() },
      { step: 2, type: "sms", template: "followup_1", completed: false, completed_at: null },
      { step: 3, type: "call", template: "discovery_call", completed: false, completed_at: null },
      { step: 4, type: "sms", template: "appointment_reminder", completed: false, completed_at: null },
      { step: 5, type: "email", template: "closing_email", completed: false, completed_at: null },
    ],
    created_at: new Date("2024-01-10").toISOString(),
  },
];

const SEED_CSV_UPLOADS = [
  {
    id: "csv-1",
    filename: "january_leads.csv",
    original_name: "january_leads.csv",
    rows_total: 50,
    rows_imported: 48,
    rows_skipped: 2,
    status: "completed",
    lead_ids: ["lead-1", "lead-2"],
    uploaded_at: new Date("2024-01-10").toISOString(),
  },
  {
    id: "csv-2",
    filename: "february_leads.csv",
    original_name: "february_leads.csv",
    rows_total: 30,
    rows_imported: 30,
    rows_skipped: 0,
    status: "completed",
    lead_ids: ["lead-3"],
    uploaded_at: new Date("2024-02-01").toISOString(),
  },
];

const SEED_SCRAPING_JOBS = [];

const SEED_MARKETING_CAMPAIGNS = [
  {
    id: "mktg-1",
    name: "Facebook Life Insurance Ad",
    platform: "facebook",
    type: "ad",
    status: "active",
    content: "Protect your family's future with affordable life insurance. Get a free quote today!",
    schedule: { frequency: "daily", time: "09:00", timezone: "America/Chicago" },
    metrics: { impressions: 1250, clicks: 87, conversions: 12 },
    created_at: new Date("2024-01-15").toISOString(),
  },
];

const SEED_AI_INSIGHTS = [
  {
    id: "insight-1",
    type: "lead_scoring",
    lead_id: "lead-1",
    score: 85,
    reasoning: "High engagement, responded to initial SMS within 2 hours, expressed strong interest in whole life policy.",
    recommendations: ["Schedule discovery call ASAP", "Send policy comparison PDF"],
    created_at: new Date("2024-01-16").toISOString(),
  },
];

// ── Mutable state ──────────────────────────────────────────────────────────
let leads = SEED_LEADS.map((l) => ({ ...l, tags: [...l.tags], csv_source: { ...l.csv_source } }));
let campaigns = SEED_CAMPAIGNS.map((c) => ({ ...c }));
let tags = SEED_TAGS.map((t) => ({ ...t }));
let contacts = SEED_CONTACTS.map((c) => ({ ...c, labels: [...c.labels], csv_source: { ...c.csv_source }, custom_fields: { ...c.custom_fields } }));
let tasks = SEED_TASKS.map((t) => ({ ...t }));
let messages = SEED_MESSAGES.map((m) => ({ ...m }));
let followups = SEED_FOLLOWUPS.map((f) => ({ ...f, actions: f.actions.map((a) => ({ ...a })) }));
let csvUploads = SEED_CSV_UPLOADS.map((c) => ({ ...c, lead_ids: [...c.lead_ids] }));
let scrapingJobs = SEED_SCRAPING_JOBS.map((s) => ({ ...s }));
let marketingCampaigns = SEED_MARKETING_CAMPAIGNS.map((m) => ({ ...m, schedule: { ...m.schedule }, metrics: { ...m.metrics } }));
let aiInsights = SEED_AI_INSIGHTS.map((i) => ({ ...i, recommendations: [...i.recommendations] }));

// ── Store API ──────────────────────────────────────────────────────────────
const store = {
  // ──────────── Preferences ────────────────────────────────────────────────
  getPreferences() {
    return { ...preferences };
  },
  setPreferences(updates) {
    preferences = { ...preferences, ...updates };
    return { ...preferences };
  },

  // ──────────── Leads ──────────────────────────────────────────────────────
  getLeads({ page = 1, limit = 10, status, campaign_id, disposition, tag } = {}) {
    let filtered = leads.slice();
    if (status) filtered = filtered.filter((l) => l.status === status);
    if (campaign_id) filtered = filtered.filter((l) => l.campaign_id === campaign_id);
    if (disposition) filtered = filtered.filter((l) => l.disposition === disposition);
    if (tag) filtered = filtered.filter((l) => l.tags && l.tags.includes(tag));
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  },
  getAllLeads() {
    return leads.map((l) => ({ ...l }));
  },
  getLeadById(id) {
    return leads.find((l) => l.id === id) || null;
  },
  createLead(data) {
    const lead = {
      id: uuidv4(),
      tags: [],
      csv_source: null,
      notes: "",
      disposition: "new",
      last_contacted_at: null,
      ...data,
      created_at: new Date().toISOString(),
    };
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
  addTagToLead(leadId, tagName) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;
    if (!lead.tags) lead.tags = [];
    if (!lead.tags.includes(tagName)) lead.tags.push(tagName);
    return { ...lead, tags: [...lead.tags] };
  },
  removeTagFromLead(leadId, tagName) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;
    if (!lead.tags) lead.tags = [];
    lead.tags = lead.tags.filter((t) => t !== tagName);
    return { ...lead, tags: [...lead.tags] };
  },
  setLeadDisposition(leadId, disposition) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;
    lead.disposition = disposition;
    lead.updated_at = new Date().toISOString();
    return { ...lead };
  },
  bulkCreateLeads(leadsData, csvSourceInfo) {
    const created = [];
    for (const data of leadsData) {
      const lead = {
        id: uuidv4(),
        tags: [],
        disposition: "new",
        notes: "",
        last_contacted_at: null,
        ...data,
        csv_source: csvSourceInfo ? { ...csvSourceInfo } : null,
        created_at: new Date().toISOString(),
      };
      leads.push(lead);
      created.push({ ...lead });
    }
    return created;
  },

  // ──────────── Tags ───────────────────────────────────────────────────────
  getTags() {
    return tags.map((t) => ({ ...t }));
  },
  getTagById(id) {
    const t = tags.find((t) => t.id === id);
    return t ? { ...t } : null;
  },
  createTag(data) {
    const existing = tags.find((t) => t.name === data.name);
    if (existing) return { ...existing };
    const tag = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
    tags.push(tag);
    return { ...tag };
  },
  updateTag(id, data) {
    const idx = tags.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tags[idx] = { ...tags[idx], ...data, id };
    return { ...tags[idx] };
  },
  deleteTag(id) {
    const idx = tags.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    tags.splice(idx, 1);
    return true;
  },

  // ──────────── Contacts ───────────────────────────────────────────────────
  getContacts({ page = 1, limit = 10, label } = {}) {
    let filtered = contacts.slice();
    if (label) filtered = filtered.filter((c) => c.labels && c.labels.includes(label));
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  },
  getContactById(id) {
    return contacts.find((c) => c.id === id) || null;
  },
  getContactByLeadId(leadId) {
    return contacts.find((c) => c.lead_id === leadId) || null;
  },
  createContact(data) {
    const contact = {
      id: uuidv4(),
      labels: [],
      custom_fields: {},
      csv_source: null,
      notes: "",
      ...data,
      created_at: new Date().toISOString(),
    };
    contacts.push(contact);
    return { ...contact };
  },
  updateContact(id, data) {
    const idx = contacts.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    contacts[idx] = { ...contacts[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...contacts[idx] };
  },
  deleteContact(id) {
    const idx = contacts.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    contacts.splice(idx, 1);
    return true;
  },

  // ──────────── Tasks & Scheduling ─────────────────────────────────────────
  getTasks({ page = 1, limit = 20, status, type, priority, due_before, due_after } = {}) {
    let filtered = tasks.slice();
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (type) filtered = filtered.filter((t) => t.type === type);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);
    if (due_before) filtered = filtered.filter((t) => t.due_date && new Date(t.due_date) <= new Date(due_before));
    if (due_after) filtered = filtered.filter((t) => t.due_date && new Date(t.due_date) >= new Date(due_after));
    // Sort by due_date ascending
    filtered.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  },
  getTaskById(id) {
    return tasks.find((t) => t.id === id) || null;
  },
  createTask(data) {
    const task = {
      id: uuidv4(),
      priority: "medium",
      status: "pending",
      lead_id: null,
      contact_id: null,
      completed_at: null,
      ...data,
      created_at: new Date().toISOString(),
    };
    tasks.push(task);
    return { ...task };
  },
  updateTask(id, data) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    if (data.status === "completed" && tasks[idx].status !== "completed") {
      data.completed_at = new Date().toISOString();
    }
    tasks[idx] = { ...tasks[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...tasks[idx] };
  },
  deleteTask(id) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    return true;
  },
  getDailySchedule(dateStr) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(targetDate.getTime())) return null;
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    const dayTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= dayStart && d <= dayEnd;
    });
    dayTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    return { date: dayStart.toISOString().split("T")[0], tasks: dayTasks };
  },

  // ──────────── Messages / Texting ─────────────────────────────────────────
  getMessages({ page = 1, limit = 20, lead_id, contact_id, direction, channel } = {}) {
    let filtered = messages.slice();
    if (lead_id) filtered = filtered.filter((m) => m.lead_id === lead_id);
    if (contact_id) filtered = filtered.filter((m) => m.contact_id === contact_id);
    if (direction) filtered = filtered.filter((m) => m.direction === direction);
    if (channel) filtered = filtered.filter((m) => m.channel === channel);
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  },
  getMessageById(id) {
    return messages.find((m) => m.id === id) || null;
  },
  createMessage(data) {
    const message = {
      id: uuidv4(),
      direction: "outbound",
      channel: "sms",
      status: "queued",
      sent_at: null,
      ...data,
      created_at: new Date().toISOString(),
    };
    // Simulate sending - mark as delivered
    if (message.status === "queued") {
      message.status = "delivered";
      message.sent_at = new Date().toISOString();
    }
    messages.push(message);
    // Update lead's last_contacted_at
    if (message.lead_id && message.direction === "outbound") {
      const lead = leads.find((l) => l.id === message.lead_id);
      if (lead) lead.last_contacted_at = message.sent_at;
    }
    return { ...message };
  },
  getConversation(leadId) {
    const convo = messages.filter((m) => m.lead_id === leadId);
    convo.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return convo.map((m) => ({ ...m }));
  },

  // ──────────── Follow-ups ─────────────────────────────────────────────────
  getFollowups({ lead_id, status } = {}) {
    let filtered = followups.slice();
    if (lead_id) filtered = filtered.filter((f) => f.lead_id === lead_id);
    if (status) filtered = filtered.filter((f) => f.status === status);
    return filtered.map((f) => ({ ...f, actions: f.actions.map((a) => ({ ...a })) }));
  },
  getFollowupById(id) {
    const f = followups.find((f) => f.id === id);
    return f ? { ...f, actions: f.actions.map((a) => ({ ...a })) } : null;
  },
  createFollowup(data) {
    const followup = {
      id: uuidv4(),
      step: 0,
      status: "active",
      last_action_at: null,
      ...data,
      created_at: new Date().toISOString(),
    };
    followups.push(followup);
    return { ...followup };
  },
  advanceFollowup(id) {
    const f = followups.find((f) => f.id === id);
    if (!f) return null;
    const currentStep = f.actions.find((a) => !a.completed);
    if (!currentStep) {
      f.status = "completed";
      return { ...f, actions: f.actions.map((a) => ({ ...a })) };
    }
    currentStep.completed = true;
    currentStep.completed_at = new Date().toISOString();
    f.step = f.actions.filter((a) => a.completed).length;
    f.last_action_at = new Date().toISOString();
    const nextStep = f.actions.find((a) => !a.completed);
    if (!nextStep) {
      f.status = "completed";
    } else {
      const delayMs = (preferences.followup_delay_hours || 24) * 60 * 60 * 1000;
      f.next_action_at = new Date(Date.now() + delayMs).toISOString();
    }
    return { ...f, actions: f.actions.map((a) => ({ ...a })) };
  },
  pauseFollowup(id) {
    const f = followups.find((f) => f.id === id);
    if (!f) return null;
    f.status = "paused";
    return { ...f, actions: f.actions.map((a) => ({ ...a })) };
  },
  resumeFollowup(id) {
    const f = followups.find((f) => f.id === id);
    if (!f) return null;
    f.status = "active";
    return { ...f, actions: f.actions.map((a) => ({ ...a })) };
  },
  deleteFollowup(id) {
    const idx = followups.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    followups.splice(idx, 1);
    return true;
  },

  // ──────────── CSV Uploads ────────────────────────────────────────────────
  getCsvUploads() {
    return csvUploads.map((c) => ({ ...c, lead_ids: [...c.lead_ids] }));
  },
  getCsvUploadById(id) {
    const c = csvUploads.find((c) => c.id === id);
    return c ? { ...c, lead_ids: [...c.lead_ids] } : null;
  },
  createCsvUpload(data) {
    const upload = {
      id: uuidv4(),
      rows_total: 0,
      rows_imported: 0,
      rows_skipped: 0,
      status: "processing",
      lead_ids: [],
      ...data,
      uploaded_at: new Date().toISOString(),
    };
    csvUploads.push(upload);
    return { ...upload, lead_ids: [...upload.lead_ids] };
  },
  updateCsvUpload(id, data) {
    const idx = csvUploads.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    csvUploads[idx] = { ...csvUploads[idx], ...data, id };
    return { ...csvUploads[idx], lead_ids: [...csvUploads[idx].lead_ids] };
  },

  // ──────────── Scraping Jobs ──────────────────────────────────────────────
  getScrapingJobs() {
    return scrapingJobs.map((s) => ({ ...s }));
  },
  getScrapingJobById(id) {
    const s = scrapingJobs.find((s) => s.id === id);
    return s ? { ...s } : null;
  },
  createScrapingJob(data) {
    const job = {
      id: uuidv4(),
      status: "queued",
      results: [],
      leads_created: 0,
      error: null,
      started_at: null,
      completed_at: null,
      ...data,
      created_at: new Date().toISOString(),
    };
    scrapingJobs.push(job);
    // Simulate scraping completion with mock results
    setTimeout(() => {
      const idx = scrapingJobs.findIndex((s) => s.id === job.id);
      if (idx !== -1 && scrapingJobs[idx].status === "queued") {
        scrapingJobs[idx].status = "completed";
        scrapingJobs[idx].started_at = new Date().toISOString();
        scrapingJobs[idx].completed_at = new Date().toISOString();
        scrapingJobs[idx].results = [
          { name: "John Doe Insurance", phone: "+1-555-0201", source: data.target_url || "directory" },
          { name: "Smith & Associates", phone: "+1-555-0202", source: data.target_url || "directory" },
          { name: "Premier Coverage LLC", phone: "+1-555-0203", source: data.target_url || "directory" },
        ];
        scrapingJobs[idx].leads_created = 3;
      }
    }, 100);
    return { ...job };
  },
  deleteScrapingJob(id) {
    const idx = scrapingJobs.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    scrapingJobs.splice(idx, 1);
    return true;
  },

  // ──────────── Marketing Campaigns ────────────────────────────────────────
  getMarketingCampaigns({ platform, status } = {}) {
    let filtered = marketingCampaigns.slice();
    if (platform) filtered = filtered.filter((m) => m.platform === platform);
    if (status) filtered = filtered.filter((m) => m.status === status);
    return filtered.map((m) => ({ ...m }));
  },
  getMarketingCampaignById(id) {
    const m = marketingCampaigns.find((m) => m.id === id);
    return m ? { ...m } : null;
  },
  createMarketingCampaign(data) {
    const campaign = {
      id: uuidv4(),
      status: "draft",
      metrics: { impressions: 0, clicks: 0, conversions: 0 },
      schedule: null,
      ...data,
      created_at: new Date().toISOString(),
    };
    marketingCampaigns.push(campaign);
    return { ...campaign };
  },
  updateMarketingCampaign(id, data) {
    const idx = marketingCampaigns.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    marketingCampaigns[idx] = { ...marketingCampaigns[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...marketingCampaigns[idx] };
  },
  deleteMarketingCampaign(id) {
    const idx = marketingCampaigns.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    marketingCampaigns.splice(idx, 1);
    return true;
  },

  // ──────────── AI Insights ────────────────────────────────────────────────
  getAiInsights({ lead_id, type } = {}) {
    let filtered = aiInsights.slice();
    if (lead_id) filtered = filtered.filter((i) => i.lead_id === lead_id);
    if (type) filtered = filtered.filter((i) => i.type === type);
    return filtered.map((i) => ({ ...i, recommendations: [...i.recommendations] }));
  },
  getAiInsightById(id) {
    const i = aiInsights.find((i) => i.id === id);
    return i ? { ...i, recommendations: [...i.recommendations] } : null;
  },
  createAiInsight(data) {
    const insight = {
      id: uuidv4(),
      recommendations: [],
      ...data,
      created_at: new Date().toISOString(),
    };
    aiInsights.push(insight);
    return { ...insight };
  },
  generateLeadScore(leadId) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;
    // Mock AI scoring based on lead attributes
    let score = 50;
    if (lead.status === "interested") score += 25;
    if (lead.status === "not_interested") score -= 30;
    if (lead.disposition === "qualified") score += 15;
    if (lead.disposition === "appointment_set") score += 20;
    if (lead.disposition === "sold") score += 30;
    if (lead.tags && lead.tags.includes("hot-lead")) score += 10;
    if (lead.tags && lead.tags.includes("referral")) score += 5;
    if (lead.last_contacted_at) score += 5;
    score = Math.min(100, Math.max(0, score));
    const recommendations = [];
    if (score >= 70) recommendations.push("High priority — schedule call immediately");
    if (score >= 50 && score < 70) recommendations.push("Warm lead — send follow-up text");
    if (score < 50) recommendations.push("Nurture with drip campaign");
    if (!lead.last_contacted_at) recommendations.push("No contact yet — initiate outreach");
    const insight = {
      id: uuidv4(),
      type: "lead_scoring",
      lead_id: leadId,
      score,
      reasoning: `Score based on status (${lead.status}), disposition (${lead.disposition}), tags, and engagement history.`,
      recommendations,
      created_at: new Date().toISOString(),
    };
    aiInsights.push(insight);
    return { ...insight };
  },

  // ──────────── Campaigns (original) ───────────────────────────────────────
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

  // ──────────── Analytics (expanded) ───────────────────────────────────────
  getAnalytics() {
    const statusCounts = leads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    const dispositionCounts = leads.reduce((acc, l) => {
      const d = l.disposition || "unknown";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const activeFollowups = followups.filter((f) => f.status === "active").length;
    const totalMessages = messages.length;
    const todayMessages = messages.filter((m) => {
      const today = new Date().toISOString().split("T")[0];
      return m.created_at.startsWith(today);
    }).length;
    return {
      total_leads: leads.length,
      total_contacts: contacts.length,
      total_campaigns: campaigns.length,
      total_tasks: tasks.length,
      pending_tasks: pendingTasks,
      active_followups: activeFollowups,
      total_messages: totalMessages,
      messages_today: todayMessages,
      synced: 42,
      sms_today: todayMessages,
      sentiment_breakdown: Object.entries(statusCounts).map(([sentiment, count]) => ({
        sentiment,
        count,
      })),
      disposition_breakdown: Object.entries(dispositionCounts).map(([disposition, count]) => ({
        disposition,
        count,
      })),
      campaigns: campaigns.map((c) => ({ id: c.id, name: c.name })),
      marketing_campaigns: marketingCampaigns.length,
      scraping_jobs: scrapingJobs.length,
      ai_insights: aiInsights.length,
    };
  },

  // ──────────── Reset (tests) ──────────────────────────────────────────────
  _reset() {
    preferences = { ...DEFAULT_PREFERENCES };
    leads = SEED_LEADS.map((l) => ({ ...l, tags: [...l.tags], csv_source: { ...l.csv_source } }));
    campaigns = SEED_CAMPAIGNS.map((c) => ({ ...c }));
    tags = SEED_TAGS.map((t) => ({ ...t }));
    contacts = SEED_CONTACTS.map((c) => ({ ...c, labels: [...c.labels], csv_source: { ...c.csv_source }, custom_fields: { ...c.custom_fields } }));
    tasks = SEED_TASKS.map((t) => ({ ...t }));
    messages = SEED_MESSAGES.map((m) => ({ ...m }));
    followups = SEED_FOLLOWUPS.map((f) => ({ ...f, actions: f.actions.map((a) => ({ ...a })) }));
    csvUploads = SEED_CSV_UPLOADS.map((c) => ({ ...c, lead_ids: [...c.lead_ids] }));
    scrapingJobs = [];
    marketingCampaigns = SEED_MARKETING_CAMPAIGNS.map((m) => ({ ...m, schedule: { ...m.schedule }, metrics: { ...m.metrics } }));
    aiInsights = SEED_AI_INSIGHTS.map((i) => ({ ...i, recommendations: [...i.recommendations] }));
  },
};

module.exports = store;
