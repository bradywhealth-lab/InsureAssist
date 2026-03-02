const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/scraping — list all scraping jobs
router.get("/api/scraping", requireApiKey, (req, res) => {
  res.json({ jobs: store.getScrapingJobs() });
});

// GET /api/scraping/:id
router.get("/api/scraping/:id", requireApiKey, (req, res) => {
  const job = store.getScrapingJobById(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "Scraping job not found" });
  res.json(job);
});

// POST /api/scraping — create a new scraping job
// Scrapes leads from websites/directories (mock implementation)
router.post("/api/scraping", requireApiKey, validate(schemas.createScrapingJob), (req, res) => {
  const job = store.createScrapingJob(req.body);
  res.status(201).json({
    ok: true,
    job,
    message: "Scraping job queued. Check status via GET /api/scraping/" + job.id,
  });
});

// DELETE /api/scraping/:id
router.delete("/api/scraping/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteScrapingJob(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Scraping job not found" });
  res.json({ ok: true });
});

// POST /api/scraping/:id/import — import scraped results as leads
router.post("/api/scraping/:id/import", requireApiKey, (req, res) => {
  const job = store.getScrapingJobById(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "Scraping job not found" });
  if (job.status !== "completed") {
    return res.status(400).json({ ok: false, error: "Scraping job is not yet completed" });
  }
  if (!job.results || job.results.length === 0) {
    return res.status(400).json({ ok: false, error: "No results to import" });
  }

  const createdLeads = [];
  for (const result of job.results) {
    const lead = store.createLead({
      name: result.name,
      email: result.email || `${result.name.toLowerCase().replace(/\s+/g, ".")}@scraped.local`,
      phone: result.phone || "",
      status: "neutral",
      disposition: "new",
      tags: ["scraped", job.type],
      notes: `Scraped from ${result.source || job.target_url}`,
    });
    createdLeads.push(lead);
  }

  res.status(201).json({
    ok: true,
    imported: createdLeads.length,
    leads: createdLeads,
  });
});

module.exports = router;
