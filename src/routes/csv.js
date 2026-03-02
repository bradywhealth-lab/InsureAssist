const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const store = require("../store");

const router = Router();

// GET /api/csv-uploads — list all CSV upload records
router.get("/api/csv-uploads", requireApiKey, (req, res) => {
  res.json({ uploads: store.getCsvUploads() });
});

// GET /api/csv-uploads/:id
router.get("/api/csv-uploads/:id", requireApiKey, (req, res) => {
  const upload = store.getCsvUploadById(req.params.id);
  if (!upload) return res.status(404).json({ ok: false, error: "CSV upload not found" });
  res.json(upload);
});

// POST /api/csv-uploads — upload leads via JSON (simulates CSV parsing)
// Accepts: { filename: "name.csv", leads: [{ name, email, phone, ... }] }
// Each lead gets tagged with the csv_source metadata.
router.post("/api/csv-uploads", requireApiKey, (req, res) => {
  try {
    const { filename, leads: leadsData } = req.body;
    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ ok: false, error: "filename is required" });
    }
    if (!leadsData || !Array.isArray(leadsData) || leadsData.length === 0) {
      return res.status(400).json({ ok: false, error: "leads must be a non-empty array" });
    }

    // Create the upload record
    const uploadRecord = store.createCsvUpload({
      filename,
      original_name: filename,
      rows_total: leadsData.length,
    });

    // Process each lead row
    const csvSourceInfo = {
      filename,
      uploaded_at: uploadRecord.uploaded_at,
      upload_id: uploadRecord.id,
    };

    let imported = 0;
    let skipped = 0;
    const importedLeadIds = [];
    const errors = [];

    for (let i = 0; i < leadsData.length; i++) {
      const row = leadsData[i];
      if (!row.name || !row.email) {
        skipped++;
        errors.push({ row: i + 1, reason: "Missing required fields: name, email" });
        continue;
      }
      const lead = store.createLead({
        name: row.name,
        email: row.email,
        phone: row.phone || "",
        status: row.status || "neutral",
        disposition: "new",
        campaign_id: row.campaign_id || "",
        tags: row.tags || [],
        notes: row.notes || "",
      });
      // Attach CSV source to the created lead
      store.updateLead(lead.id, { csv_source: csvSourceInfo });
      importedLeadIds.push(lead.id);
      imported++;
    }

    // Update the upload record with results
    store.updateCsvUpload(uploadRecord.id, {
      rows_imported: imported,
      rows_skipped: skipped,
      status: "completed",
      lead_ids: importedLeadIds,
    });

    const result = store.getCsvUploadById(uploadRecord.id);
    res.status(201).json({
      ok: true,
      upload: result,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to process CSV upload" });
  }
});

module.exports = router;
