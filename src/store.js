const { v4: uuidv4 } = require("uuid");

// ── Default / seed data ────────────────────────────────────────────────────

const DEFAULT_PREFERENCES = {
  onlysales_enabled: false,
  onlysales_api_key: "",
  onlysales_api_url: "http://localhost:3001",
  auto_sync_leads: true,
  auto_analyze_sentiment: true,
  auto_create_tasks: true,
};

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

const SEED_POSTS = [
  {
    id: "post-1",
    platforms: ["instagram", "facebook"],
    type: "post",
    status: "published",
    caption:
      "🏥 Did you know open enrollment ends soon? Don't miss your chance to secure the best health coverage for your family! DM me to learn more. #HealthInsurance #OpenEnrollment #InsureAssist",
    image_suggestion:
      "Warm, professional photo of a smiling insurance agent at a clean desk with a laptop, natural light, trust-building atmosphere",
    image_url: null,
    scheduled_at: new Date("2024-01-15T10:00:00").toISOString(),
    published_at: new Date("2024-01-15T10:02:00").toISOString(),
    tags: ["health insurance", "open enrollment"],
    created_at: new Date("2024-01-14").toISOString(),
  },
  {
    id: "post-2",
    platforms: ["instagram"],
    type: "reel",
    status: "scheduled",
    caption:
      "3 things your health insurance SHOULD cover (but might not!) 👇 Watch until the end for a free consultation offer. #HealthTips #InsuranceFacts #KnowYourCoverage",
    image_suggestion:
      "Split-screen animation: confused person with medical bill on left, relieved person with great coverage on right",
    image_url: null,
    scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: null,
    tags: ["tips", "education", "reel"],
    created_at: new Date().toISOString(),
  },
  {
    id: "post-3",
    platforms: ["linkedin"],
    type: "post",
    status: "draft",
    caption:
      "The health insurance landscape is changing. Here are 5 things every business owner needs to know about group health plans for their team...",
    image_suggestion:
      "Clean infographic with 5 numbered points about group health insurance benefits on a professional blue background",
    image_url: null,
    scheduled_at: null,
    published_at: null,
    tags: ["business", "group plans", "linkedin"],
    created_at: new Date().toISOString(),
  },
];

const SEED_TASKS = [
  {
    id: "task-1",
    title: "Follow up with Alice Johnson — policy renewal",
    description: "Alice's policy renews Feb 15. Call to discuss upgrade options and confirm beneficiary info.",
    priority: "high",
    status: "pending",
    category: "business",
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    lead_id: "lead-1",
    tags: ["follow-up", "renewal"],
    created_at: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Prepare Q1 enrollment presentation for TechCorp",
    description: "Create slide deck covering plan options, network, and pricing tiers",
    priority: "medium",
    status: "in_progress",
    category: "business",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lead_id: null,
    tags: ["presentation", "group"],
    created_at: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Schedule annual physical",
    description: "Book checkup — it has been over a year",
    priority: "low",
    status: "pending",
    category: "personal",
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    lead_id: null,
    tags: ["health", "personal"],
    created_at: new Date().toISOString(),
  },
];

const SEED_REMINDERS = [
  {
    id: "reminder-1",
    title: "Open enrollment deadline",
    due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    recurring: false,
    recurrence: null,
    category: "business",
    created_at: new Date().toISOString(),
  },
  {
    id: "reminder-2",
    title: "Post on Instagram — Tuesday morning",
    due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    recurring: true,
    recurrence: "weekly",
    category: "social",
    created_at: new Date().toISOString(),
  },
];

const SEED_GOALS = [
  {
    id: "goal-1",
    title: "Close 20 new health insurance policies this quarter",
    description: "Focus on referrals and LinkedIn outreach. Target self-employed and small business owners.",
    target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 35,
    category: "business",
    milestones: ["10 leads contacted", "5 quotes sent", "2 closed"],
    created_at: new Date().toISOString(),
  },
  {
    id: "goal-2",
    title: "Grow Instagram to 1,000 followers",
    description: "Post 3x per week. Engage with health, wellness, and small-business community daily.",
    target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 22,
    category: "social",
    milestones: ["250 followers", "500 followers", "750 followers"],
    created_at: new Date().toISOString(),
  },
  {
    id: "goal-3",
    title: "Complete 30-day fitness challenge",
    description: "Exercise every day for 30 days to model the healthy lifestyle I advocate for clients",
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 10,
    category: "personal",
    milestones: ["Day 7", "Day 15", "Day 30"],
    created_at: new Date().toISOString(),
  },
];

// ── In-memory state ────────────────────────────────────────────────────────

let preferences = { ...DEFAULT_PREFERENCES };
let leads = SEED_LEADS.map((l) => ({ ...l }));
let campaigns = SEED_CAMPAIGNS.map((c) => ({ ...c }));
let socialPosts = SEED_POSTS.map((p) => ({ ...p }));
let tasks = SEED_TASKS.map((t) => ({ ...t }));
let reminders = SEED_REMINDERS.map((r) => ({ ...r }));
let goals = SEED_GOALS.map((g) => ({ ...g }));
let conversations = {}; // conversationId → message[]

// ── Store API ──────────────────────────────────────────────────────────────

const store = {
  // ── Preferences ───────────────────────────────────────────────────────
  getPreferences() { return { ...preferences }; },
  setPreferences(updates) {
    preferences = { ...preferences, ...updates };
    return { ...preferences };
  },

  // ── Leads ─────────────────────────────────────────────────────────────
  getLeads({ page = 1, limit = 10, status, campaign_id } = {}) {
    let filtered = leads.slice();
    if (status) filtered = filtered.filter((l) => l.status === status);
    if (campaign_id) filtered = filtered.filter((l) => l.campaign_id === campaign_id);
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  },
  getLeadById(id) { return leads.find((l) => l.id === id) || null; },
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

  // ── Campaigns ─────────────────────────────────────────────────────────
  getCampaigns() { return campaigns.map((c) => ({ ...c })); },
  getCampaignById(id) {
    const c = campaigns.find((c) => c.id === id);
    return c ? { ...c } : null;
  },
  createCampaign(data) {
    const campaign = { id: uuidv4(), lead_count: 0, ...data, created_at: new Date().toISOString() };
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

  // ── Analytics ─────────────────────────────────────────────────────────
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
      sentiment_breakdown: Object.entries(statusCounts).map(([sentiment, count]) => ({ sentiment, count })),
      campaigns: campaigns.map((c) => ({ id: c.id, name: c.name })),
    };
  },

  // ── Social Posts ──────────────────────────────────────────────────────
  getSocialPosts({ status, platform, type } = {}) {
    let filtered = socialPosts.slice();
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (platform) filtered = filtered.filter((p) => p.platforms.includes(platform));
    if (type) filtered = filtered.filter((p) => p.type === type);
    return filtered.map((p) => ({ ...p }));
  },
  getSocialPostById(id) {
    const p = socialPosts.find((p) => p.id === id);
    return p ? { ...p } : null;
  },
  createSocialPost(data) {
    const post = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
    socialPosts.push(post);
    return { ...post };
  },
  updateSocialPost(id, data) {
    const idx = socialPosts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    socialPosts[idx] = { ...socialPosts[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...socialPosts[idx] };
  },
  deleteSocialPost(id) {
    const idx = socialPosts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    socialPosts.splice(idx, 1);
    return true;
  },
  publishSocialPost(id) {
    const idx = socialPosts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    socialPosts[idx] = {
      ...socialPosts[idx],
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { ...socialPosts[idx] };
  },
  getSocialCalendar() {
    return socialPosts
      .filter((p) => p.scheduled_at || p.published_at)
      .map((p) => ({
        id: p.id,
        platforms: p.platforms,
        type: p.type,
        status: p.status,
        caption_preview: p.caption
          ? p.caption.slice(0, 80) + (p.caption.length > 80 ? "…" : "")
          : "",
        scheduled_at: p.scheduled_at,
        published_at: p.published_at,
      }))
      .sort((a, b) => {
        const aDate = new Date(a.scheduled_at || a.published_at);
        const bDate = new Date(b.scheduled_at || b.published_at);
        return aDate - bDate;
      });
  },
  getSocialAnalytics() {
    const byStatus = socialPosts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const byPlatform = {};
    socialPosts.forEach((p) => {
      (p.platforms || []).forEach((pl) => {
        byPlatform[pl] = (byPlatform[pl] || 0) + 1;
      });
    });
    return {
      total_posts: socialPosts.length,
      by_status: byStatus,
      by_platform: byPlatform,
      scheduled_upcoming: socialPosts.filter(
        (p) => p.status === "scheduled" && p.scheduled_at && new Date(p.scheduled_at) > new Date()
      ).length,
    };
  },

  // ── Tasks ─────────────────────────────────────────────────────────────
  getTasks({ status, category, priority } = {}) {
    let filtered = tasks.slice();
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (category) filtered = filtered.filter((t) => t.category === category);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);
    return filtered.map((t) => ({ ...t }));
  },
  getTaskById(id) {
    const t = tasks.find((t) => t.id === id);
    return t ? { ...t } : null;
  },
  createTask(data) {
    const task = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
    tasks.push(task);
    return { ...task };
  },
  updateTask(id, data) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...tasks[idx] };
  },
  deleteTask(id) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    return true;
  },

  // ── Reminders ─────────────────────────────────────────────────────────
  getReminders({ category } = {}) {
    let filtered = reminders.slice();
    if (category) filtered = filtered.filter((r) => r.category === category);
    return filtered.map((r) => ({ ...r }));
  },
  getReminderById(id) {
    const r = reminders.find((r) => r.id === id);
    return r ? { ...r } : null;
  },
  createReminder(data) {
    const reminder = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
    reminders.push(reminder);
    return { ...reminder };
  },
  updateReminder(id, data) {
    const idx = reminders.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    reminders[idx] = { ...reminders[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...reminders[idx] };
  },
  deleteReminder(id) {
    const idx = reminders.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    reminders.splice(idx, 1);
    return true;
  },

  // ── Goals ─────────────────────────────────────────────────────────────
  getGoals({ category } = {}) {
    let filtered = goals.slice();
    if (category) filtered = filtered.filter((g) => g.category === category);
    return filtered.map((g) => ({ ...g }));
  },
  getGoalById(id) {
    const g = goals.find((g) => g.id === id);
    return g ? { ...g } : null;
  },
  createGoal(data) {
    const goal = { id: uuidv4(), progress: 0, ...data, created_at: new Date().toISOString() };
    goals.push(goal);
    return { ...goal };
  },
  updateGoal(id, data) {
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    goals[idx] = { ...goals[idx], ...data, id, updated_at: new Date().toISOString() };
    return { ...goals[idx] };
  },
  deleteGoal(id) {
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) return false;
    goals.splice(idx, 1);
    return true;
  },

  // ── Conversations (AI chat history) ──────────────────────────────────
  getConversation(id) { return (conversations[id] || []).slice(); },
  appendToConversation(id, messages) {
    if (!conversations[id]) conversations[id] = [];
    conversations[id].push(...messages);
    // Keep last 40 messages to avoid unbounded growth
    if (conversations[id].length > 40) {
      conversations[id] = conversations[id].slice(-40);
    }
    return conversations[id].slice();
  },
  deleteConversation(id) {
    if (!conversations[id]) return false;
    delete conversations[id];
    return true;
  },

  // ── Reset (tests) ─────────────────────────────────────────────────────
  _reset() {
    preferences = { ...DEFAULT_PREFERENCES };
    leads = SEED_LEADS.map((l) => ({ ...l }));
    campaigns = SEED_CAMPAIGNS.map((c) => ({ ...c }));
    socialPosts = SEED_POSTS.map((p) => ({ ...p }));
    tasks = SEED_TASKS.map((t) => ({ ...t }));
    reminders = SEED_REMINDERS.map((r) => ({ ...r }));
    goals = SEED_GOALS.map((g) => ({ ...g }));
    conversations = {};
  },
};

module.exports = store;
