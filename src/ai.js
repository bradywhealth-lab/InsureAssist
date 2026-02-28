/**
 * AI module — wraps the Anthropic Claude API.
 *
 * When ANTHROPIC_API_KEY is set, all functions call claude-haiku-4-5 for real
 * intelligence. When it is absent (local dev without a key, CI), every function
 * falls back to curated mock responses so the rest of the app keeps working.
 */

const SYSTEM_PROMPT = `You are an elite AI assistant embedded in InsureAssist, a CRM for health insurance agents. You help with three areas:

1. HEALTH INSURANCE BUSINESS — lead management, client follow-ups, policy renewals, enrollment strategy, compliance reminders, quotes, and pipeline organization.
2. SOCIAL MEDIA — creating engaging posts, reels, stories, and captions for Instagram, Facebook, LinkedIn, and TikTok. Content targets people who need health insurance (self-employed, families, small business owners). Always include relevant hashtags.
3. PERSONAL LIFE — tasks, goals, reminders, work-life balance, scheduling, and personal health.

Rules:
- Be concise, specific, and immediately actionable.
- Never include real client PII in social media content suggestions.
- For insurance topics, stay compliant (no guarantees about coverage).
- Format lists with → or numbered steps for readability.`;

// ── Anthropic client (lazy — created only when API key is present) ─────────

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const Anthropic = require("@anthropic-ai/sdk");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function callClaude(messages, maxTokens = 1024) {
  const client = getClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY not set");
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages,
  });
  return response.content[0].text;
}

// ── Mock responses (used when no API key is configured) ───────────────────

const MOCK_CAPTIONS = {
  instagram: {
    post: `🏥 Your health is your greatest asset — protect it.\n\nOpen enrollment is NOW open. Whether you're self-employed, between jobs, or just looking for better coverage, I'll find a plan that fits your budget and needs.\n\n✅ ACA-compliant plans\n✅ Telehealth included\n✅ Free consultation\n\nDM me "COVERAGE" to get started! 🔒\n\n#HealthInsurance #OpenEnrollment #HealthCoverage #InsuranceAgent #HealthFirst #AffordableHealthcare #ACA #InsuranceTips #ProtectYourHealth #HealthIsWealth`,
    reel: `POV: You finally understand your health insurance 😮‍💨\n\n3 things nobody tells you:\n→ Preventive care is usually FREE\n→ Out-of-network ≠ not covered\n→ You can switch plans after a life event\n\nSave this! And DM me if you have questions 👇\n\n#HealthInsuranceTips #InsuranceHacks #HealthcareFacts #KnowYourRights #HealthInsurance #InsuranceAgent #OpenEnrollment #HealthTips`,
    story: `Quick question: when did you last review your health plan? 🤔\nSwipe up to find out if you're overpaying! 💸`,
  },
  facebook: {
    post: `Are you overpaying for health insurance? 📋\n\nMost people don't realize they qualify for subsidies that can cut their premium by 50% or more. As a local health insurance agent, I help families and self-employed individuals find the right plan at the right price.\n\n🔹 Individual & family plans\n🔹 Small group benefits\n🔹 Medicare supplements\n🔹 Short-term coverage\n\nSchedule your FREE 15-minute review today. Comment "INFO" or send me a message! \n\n#HealthInsurance #FamilyCoverage #AffordableHealthcare #LocalAgent`,
  },
  linkedin: {
    post: `The #1 mistake business owners make with employee benefits? Waiting until the last minute.\n\nGroup health insurance enrollment windows close fast, and scrambling leaves you with limited options and unhappy employees.\n\nWhat I've learned helping 50+ small businesses:\n→ Start planning 90 days before renewal\n→ Survey employees on coverage priorities first\n→ Compare at least 3 carriers\n→ Consider HSA-paired plans to reduce premiums\n\nBusinesses that invest in quality health benefits see 34% lower turnover.\n\nReady to review your group plan before next renewal? Let's connect.\n\n#GroupInsurance #SmallBusiness #EmployeeBenefits #HealthInsurance #HRLeaders #BusinessOwners`,
  },
  tiktok: {
    reel: `Reply to @user: "Is health insurance worth it?" Let me break it down 🧵\n\n1️⃣ One ER visit without insurance = $3,000–$30,000\n2️⃣ A good plan = $150–$400/month\n3️⃣ Math doesn't lie 📊\n\nDM me if you want help finding the right plan! 💙\n\n#HealthInsurance #MoneyTips #FinancialLiteracy #HealthcareCosts #InsuranceTips #LearnOnTikTok`,
  },
};

const MOCK_IMAGE_SUGGESTIONS = {
  instagram: "Bright, high-contrast photo of healthy food or active lifestyle. Warm tones, genuine smile. Overlay text with 1–2 key stats. Size: 1080×1080px.",
  facebook: "Friendly, approachable headshot or family photo in a comfortable setting. Soft blue/green tones conveying trust. Landscape format 1200×628px.",
  linkedin: "Clean, corporate infographic or professional headshot with branded color palette. White background with accent colors. Size: 1200×627px.",
  tiktok: "Vertical video thumbnail: bold text overlay, bright background, expressive face or before/after visual. Size: 1080×1920px.",
};

const MOCK_CHAT_RESPONSES = {
  leads: `Here's your lead follow-up strategy:\n\n**High Priority (Today)**\n→ Alice Johnson — 3+ days since last contact. She mentioned prescription coverage concerns. Call with Silver plan info that includes Tier 1–3 drug coverage.\n\n**This Week**\n→ Bob Martinez — neutral status. Send the family coverage comparison PDF. Text first to confirm best time.\n→ Carol Smith — marked not interested. Schedule a 90-day check-in; circumstances change.\n\n**Script for your follow-up call:**\n"Hi [Name], it's [Your Name]. I wanted to circle back with something specific about [their concern]. Do you have 10 minutes this week?"\n\n💡 Pro tip: 80% of sales happen on the 5th–12th contact. Most agents stop at 2.`,

  social: `Here's your content plan for the week:\n\n**Monday** — Instagram post: Client success story (anonymized). Testimonial format.\n**Wednesday** — LinkedIn article: "5 questions to ask before choosing a health plan"\n**Friday** — Instagram Reel: Quick myth-busting video (30 sec)\n**Sunday** — Facebook: Weekend engagement question ("What's your biggest health insurance question?")\n\n💡 Best posting times:\n→ Instagram: Tue/Wed/Fri 9–11am\n→ LinkedIn: Tue–Thu 7–8am or 5–6pm\n→ Facebook: Wed 11am–1pm\n\nWant me to write the captions for any of these?`,

  tasks: `Based on your current pipeline, here are your top 3 priorities:\n\n1. **🔴 HIGH** — Follow up with Alice Johnson (renewal in 3 days). Block 30 min tomorrow morning.\n2. **🟡 MEDIUM** — Finish TechCorp slide deck (due in 7 days). Start with the cost comparison slide first.\n3. **🟢 LOW** — Schedule your own annual physical. You can't sell health without modeling it.\n\nWant me to create calendar blocks for these?`,

  goals: `Goal progress snapshot:\n\n📈 **Business:** 35% to your 20-policy Q1 goal\n→ You need 13 more policies in ~60 days\n→ That's ~2.2/week — very achievable with consistent follow-up\n→ Focus: Ask every current client for 1 referral this week\n\n📱 **Social:** 22% to 1,000 Instagram followers\n→ Posting 3x/week consistently adds ~15–20 followers/week\n→ Reels are outperforming regular posts 3:1 — prioritize them\n\n🏃 **Personal:** 10% through fitness challenge\n→ Keep it going! Consistency is the goal, not perfection.`,

  insights: `**Business Insights**\n→ 3 leads in "interested" stage — follow up now, strike while warm\n→ Welcome Campaign outperforming Follow Up by 2x on engagement\n→ Best time to call leads: Tuesday–Thursday, 10am–12pm and 4–6pm\n\n**Social Media**\n→ 1 post scheduled — consider adding 2 more this week\n→ LinkedIn posts get 3x the professional engagement vs. Facebook\n\n**Personal**\n→ 2 tasks overdue — tackle the quick ones first for momentum\n→ Fitness goal needs a daily 5-min check-in to stay on track`,

  general: `I'm your InsureAssist AI — here to help with your health insurance business, social media, and personal goals.\n\nTry asking me:\n→ "Help me follow up with my leads"\n→ "Write an Instagram caption about open enrollment"\n→ "What should I post this week?"\n→ "Give me a follow-up script for a cold lead"\n→ "How am I doing on my goals?"\n→ "Create a task to call Bob Martinez tomorrow"`,
};

function getMockChatResponse(messages) {
  const lastMsg = (messages[messages.length - 1]?.content || "").toLowerCase();

  if (/lead|follow.?up|pipeline|prospect|client/.test(lastMsg)) return MOCK_CHAT_RESPONSES.leads;
  if (/post|caption|instagram|facebook|linkedin|tiktok|reel|social|content/.test(lastMsg)) return MOCK_CHAT_RESPONSES.social;
  if (/task|todo|priority|deadline|schedule/.test(lastMsg)) return MOCK_CHAT_RESPONSES.tasks;
  if (/goal|progress|milestone|quarter|target/.test(lastMsg)) return MOCK_CHAT_RESPONSES.goals;
  if (/insight|analytics|report|performance|how am i/.test(lastMsg)) return MOCK_CHAT_RESPONSES.insights;
  return MOCK_CHAT_RESPONSES.general;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Multi-turn chat. `messages` is the full conversation history in
 * [{role, content}] format (Anthropic-compatible).
 */
async function chat(messages) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await callClaude(messages);
    } catch (err) {
      console.error("AI API error, using mock response:", err.message);
    }
  }
  return getMockChatResponse(messages);
}

/**
 * Generate a platform-optimised caption.
 */
async function generateCaption({ platform, type = "post", topic, tone = "professional", include_hashtags = true }) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `Write a ${tone} ${type} caption for ${platform} about: "${topic}".${include_hashtags ? " Include 8–12 relevant hashtags at the end." : ""} Keep it authentic and engaging. Match the culture of ${platform}.`;
      return await callClaude([{ role: "user", content: prompt }], 512);
    } catch (err) {
      console.error("AI API error, using mock caption:", err.message);
    }
  }

  const platformCaptions = MOCK_CAPTIONS[platform] || MOCK_CAPTIONS.instagram;
  return platformCaptions[type] || platformCaptions.post || Object.values(platformCaptions)[0];
}

/**
 * Generate a full post (caption + image suggestion + best posting times).
 */
async function generatePost({ platforms, type = "post", topic, tone = "professional", audience = "general" }) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const platformList = platforms.join(", ");
      const prompt = `Create a complete social media ${type} for ${platformList} targeting ${audience} about: "${topic}".\n\nProvide:\n1. Caption (with hashtags, tailored per platform if multiple)\n2. Image/visual suggestion (describe what the image should look like)\n3. Best time to post\n4. One engagement hook (question or CTA)\n\nTone: ${tone}. Be specific and ready-to-use.`;
      return await callClaude([{ role: "user", content: prompt }], 1024);
    } catch (err) {
      console.error("AI API error, using mock post:", err.message);
    }
  }

  const platform = platforms[0] || "instagram";
  const caption = await generateCaption({ platform, type, topic, tone });
  const imageSuggestion = MOCK_IMAGE_SUGGESTIONS[platform] || MOCK_IMAGE_SUGGESTIONS.instagram;
  return `**Caption:**\n${caption}\n\n**Image suggestion:**\n${imageSuggestion}\n\n**Best time to post:** Tuesday or Wednesday, 9–11am local time\n\n**Engagement hook:** End with a question or "DM me [keyword] to learn more."`;
}

/**
 * Analyze a lead and return engagement recommendations.
 */
async function analyzeLead(lead) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `Analyze this health insurance lead and give 3 specific, actionable follow-up recommendations:\n\nName: ${lead.name}\nStatus: ${lead.status}\nCampaign: ${lead.campaign_id || "none"}\n\nKeep each recommendation to 1–2 sentences. Focus on what to say, when to reach out, and which channel to use.`;
      return await callClaude([{ role: "user", content: prompt }], 512);
    } catch (err) {
      console.error("AI API error, using mock analysis:", err.message);
    }
  }

  const statusAdvice = {
    interested: `→ Strike while warm — reach out within 24 hours.\n→ Lead with the plan that best matches their profile. Offer a 15-min call with a specific time slot.\n→ Send a follow-up text same day if no answer: "Hey ${lead.name}, just left a voicemail — would love to find you the right plan this week!"`,
    neutral: `→ Send a value-add email first (comparison chart, FAQ, or short article about open enrollment).\n→ Follow up by phone 2 days later. Open with "I sent over some info — did anything stand out?"\n→ Offer a no-pressure 10-min chat to answer questions.`,
    not_interested: `→ Don't push — acknowledge and leave the door open: "Totally understand! If anything changes, I'm here."\n→ Set a 60-day automated reminder to check back.\n→ Add to a low-frequency email list for tips and enrollment reminders.`,
  };

  return statusAdvice[lead.status] || statusAdvice.neutral;
}

/**
 * Generate business and personal insights from current CRM data.
 */
async function getInsights(context) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `You are an InsureAssist CRM AI. Analyze this data and give 4–6 bullet-point insights with specific next actions:\n\n${JSON.stringify(context, null, 2)}\n\nCover: lead pipeline health, social media consistency, task urgency, goal trajectory. Be direct and specific.`;
      return await callClaude([{ role: "user", content: prompt }], 768);
    } catch (err) {
      console.error("AI API error, using mock insights:", err.message);
    }
  }

  return MOCK_CHAT_RESPONSES.insights;
}

module.exports = { chat, generateCaption, generatePost, analyzeLead, getInsights };
