const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");
const ai = require("../ai");

const router = Router();

// ── Post CRUD ─────────────────────────────────────────────────────────────

// GET /api/social/posts — filterable by status, platform, type
router.get("/api/social/posts", requireApiKey, (req, res) => {
  const { status, platform, type } = req.query;
  const posts = store.getSocialPosts({ status, platform, type });
  res.json({ posts });
});

// GET /api/social/posts/:id
router.get("/api/social/posts/:id", requireApiKey, (req, res) => {
  const post = store.getSocialPostById(req.params.id);
  if (!post) return res.status(404).json({ ok: false, error: "Post not found" });
  res.json(post);
});

// POST /api/social/posts — create a draft post
router.post("/api/social/posts", requireApiKey, validate(schemas.createSocialPost), (req, res) => {
  const post = store.createSocialPost({ ...req.body, published_at: null });
  res.status(201).json(post);
});

// PUT /api/social/posts/:id
router.put("/api/social/posts/:id", requireApiKey, validate(schemas.updateSocialPost), (req, res) => {
  const post = store.updateSocialPost(req.params.id, req.body);
  if (!post) return res.status(404).json({ ok: false, error: "Post not found" });
  res.json(post);
});

// DELETE /api/social/posts/:id
router.delete("/api/social/posts/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteSocialPost(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Post not found" });
  res.json({ ok: true });
});

// POST /api/social/posts/:id/publish — mark as published immediately
router.post("/api/social/posts/:id/publish", requireApiKey, (req, res) => {
  const post = store.publishSocialPost(req.params.id);
  if (!post) return res.status(404).json({ ok: false, error: "Post not found" });
  res.json(post);
});

// ── Calendar & analytics ──────────────────────────────────────────────────

// GET /api/social/calendar — chronological view of scheduled/published posts
router.get("/api/social/calendar", requireApiKey, (req, res) => {
  res.json({ calendar: store.getSocialCalendar() });
});

// GET /api/social/analytics — counts by status and platform
router.get("/api/social/analytics", requireApiKey, (req, res) => {
  res.json(store.getSocialAnalytics());
});

// ── AI generation ─────────────────────────────────────────────────────────

// POST /api/social/generate/caption — AI-generated platform-specific caption
router.post(
  "/api/social/generate/caption",
  requireApiKey,
  validate(schemas.generateCaption),
  async (req, res) => {
    try {
      const caption = await ai.generateCaption(req.body);
      res.json({ ok: true, caption, params: req.body });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
);

// POST /api/social/generate/post — AI-generated full post (caption + image + tips)
router.post(
  "/api/social/generate/post",
  requireApiKey,
  validate(schemas.generatePost),
  async (req, res) => {
    try {
      const content = await ai.generatePost(req.body);
      res.json({ ok: true, content, params: req.body });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
);

module.exports = router;
