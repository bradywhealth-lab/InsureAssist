const request = require("supertest");
const { createApp } = require("../src/app");

describe("Social Media API", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  // ── GET /api/social/posts ──────────────────────────────────────────────
  describe("GET /api/social/posts", () => {
    it("returns all seed posts", async () => {
      const res = await request(app).get("/api/social/posts");
      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(3);
    });

    it("filters by status=published", async () => {
      const res = await request(app).get("/api/social/posts?status=published");
      expect(res.body.posts.every((p) => p.status === "published")).toBe(true);
    });

    it("filters by platform=instagram", async () => {
      const res = await request(app).get("/api/social/posts?platform=instagram");
      expect(res.body.posts.every((p) => p.platforms.includes("instagram"))).toBe(true);
    });

    it("filters by type=reel", async () => {
      const res = await request(app).get("/api/social/posts?type=reel");
      expect(res.body.posts.every((p) => p.type === "reel")).toBe(true);
    });

    it("returns empty array for unmatched filter", async () => {
      const res = await request(app).get("/api/social/posts?status=published&platform=tiktok");
      expect(res.body.posts).toHaveLength(0);
    });
  });

  // ── GET /api/social/posts/:id ──────────────────────────────────────────
  describe("GET /api/social/posts/:id", () => {
    it("returns the correct post", async () => {
      const res = await request(app).get("/api/social/posts/post-1");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("post-1");
    });

    it("returns 404 for unknown post", async () => {
      const res = await request(app).get("/api/social/posts/ghost");
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  // ── POST /api/social/posts ─────────────────────────────────────────────
  describe("POST /api/social/posts", () => {
    it("creates a draft post and returns 201", async () => {
      const res = await request(app)
        .post("/api/social/posts")
        .send({
          platforms: ["instagram"],
          type: "reel",
          caption: "Open enrollment is here! #HealthInsurance",
          tags: ["open enrollment"],
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe("draft");
    });

    it("defaults status to draft when omitted", async () => {
      const res = await request(app)
        .post("/api/social/posts")
        .send({ platforms: ["linkedin"], type: "post" });
      expect(res.body.status).toBe("draft");
    });

    it("rejects missing platforms — 400", async () => {
      const res = await request(app)
        .post("/api/social/posts")
        .send({ type: "post", caption: "No platform" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid platform value — 400", async () => {
      const res = await request(app)
        .post("/api/social/posts")
        .send({ platforms: ["snapchat"], type: "post" });
      expect(res.status).toBe(400);
    });

    it("strips unknown fields", async () => {
      const res = await request(app)
        .post("/api/social/posts")
        .send({ platforms: ["facebook"], injected: "evil" });
      expect(res.body.injected).toBeUndefined();
    });
  });

  // ── PUT /api/social/posts/:id ──────────────────────────────────────────
  describe("PUT /api/social/posts/:id", () => {
    it("updates caption and status", async () => {
      const res = await request(app)
        .put("/api/social/posts/post-3")
        .send({ caption: "Updated caption", status: "scheduled", scheduled_at: new Date(Date.now() + 86400000).toISOString() });
      expect(res.status).toBe(200);
      expect(res.body.caption).toBe("Updated caption");
      expect(res.body.status).toBe("scheduled");
    });

    it("sets updated_at", async () => {
      const res = await request(app).put("/api/social/posts/post-3").send({ type: "story" });
      expect(res.body.updated_at).toBeDefined();
    });

    it("returns 404 for unknown post", async () => {
      const res = await request(app).put("/api/social/posts/ghost").send({ caption: "x" });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/social/posts/:id ───────────────────────────────────────
  describe("DELETE /api/social/posts/:id", () => {
    it("deletes a post and returns ok:true", async () => {
      const res = await request(app).delete("/api/social/posts/post-3");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("deleted post is no longer accessible", async () => {
      await request(app).delete("/api/social/posts/post-3");
      const get = await request(app).get("/api/social/posts/post-3");
      expect(get.status).toBe(404);
    });

    it("returns 404 for unknown post", async () => {
      const res = await request(app).delete("/api/social/posts/ghost");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/social/posts/:id/publish ────────────────────────────────
  describe("POST /api/social/posts/:id/publish", () => {
    it("publishes a post and sets published_at", async () => {
      const res = await request(app).post("/api/social/posts/post-3/publish");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("published");
      expect(res.body.published_at).toBeDefined();
    });

    it("returns 404 for unknown post", async () => {
      const res = await request(app).post("/api/social/posts/ghost/publish");
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/social/calendar ───────────────────────────────────────────
  describe("GET /api/social/calendar", () => {
    it("returns a chronological calendar", async () => {
      const res = await request(app).get("/api/social/calendar");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.calendar)).toBe(true);
    });

    it("excludes drafts with no scheduled_at or published_at", async () => {
      const res = await request(app).get("/api/social/calendar");
      const entries = res.body.calendar;
      // All entries should have either scheduled_at or published_at
      entries.forEach((e) => {
        expect(e.scheduled_at || e.published_at).toBeTruthy();
      });
    });

    it("includes caption_preview truncated to 80 chars", async () => {
      const res = await request(app).get("/api/social/calendar");
      res.body.calendar.forEach((e) => {
        expect(e.caption_preview.length).toBeLessThanOrEqual(81); // 80 + "…"
      });
    });
  });

  // ── GET /api/social/analytics ──────────────────────────────────────────
  describe("GET /api/social/analytics", () => {
    it("returns analytics with total_posts", async () => {
      const res = await request(app).get("/api/social/analytics");
      expect(res.status).toBe(200);
      expect(res.body.total_posts).toBe(3);
    });

    it("breaks down counts by status", async () => {
      const res = await request(app).get("/api/social/analytics");
      expect(res.body.by_status).toBeDefined();
      expect(typeof res.body.by_status.published).toBe("number");
    });

    it("breaks down counts by platform", async () => {
      const res = await request(app).get("/api/social/analytics");
      expect(res.body.by_platform).toBeDefined();
      expect(typeof res.body.by_platform.instagram).toBe("number");
    });
  });

  // ── POST /api/social/generate/caption ─────────────────────────────────
  describe("POST /api/social/generate/caption", () => {
    it("returns a caption string", async () => {
      const res = await request(app)
        .post("/api/social/generate/caption")
        .send({ platform: "instagram", topic: "open enrollment", type: "post" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.caption).toBe("string");
      expect(res.body.caption.length).toBeGreaterThan(0);
    });

    it("includes the original params in the response", async () => {
      const res = await request(app)
        .post("/api/social/generate/caption")
        .send({ platform: "linkedin", topic: "group plans" });
      expect(res.body.params.platform).toBe("linkedin");
    });

    it("rejects missing topic — 400", async () => {
      const res = await request(app)
        .post("/api/social/generate/caption")
        .send({ platform: "instagram" });
      expect(res.status).toBe(400);
    });

    it("rejects missing platform — 400", async () => {
      const res = await request(app)
        .post("/api/social/generate/caption")
        .send({ topic: "open enrollment" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid platform — 400", async () => {
      const res = await request(app)
        .post("/api/social/generate/caption")
        .send({ platform: "myspace", topic: "health" });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/social/generate/post ────────────────────────────────────
  describe("POST /api/social/generate/post", () => {
    it("returns content string", async () => {
      const res = await request(app)
        .post("/api/social/generate/post")
        .send({ platforms: ["instagram", "facebook"], topic: "family health plans" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.content).toBe("string");
    });

    it("rejects missing platforms — 400", async () => {
      const res = await request(app)
        .post("/api/social/generate/post")
        .send({ topic: "health" });
      expect(res.status).toBe(400);
    });

    it("rejects missing topic — 400", async () => {
      const res = await request(app)
        .post("/api/social/generate/post")
        .send({ platforms: ["instagram"] });
      expect(res.status).toBe(400);
    });
  });
});
