const { Router } = require("express");
const { requireApiKey } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const store = require("../store");

const router = Router();

// GET /api/contacts — paginated, filterable by label
router.get("/api/contacts", requireApiKey, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10", 10)));
  const { label } = req.query;
  res.json(store.getContacts({ page, limit, label }));
});

// GET /api/contacts/:id
router.get("/api/contacts/:id", requireApiKey, (req, res) => {
  const contact = store.getContactById(req.params.id);
  if (!contact) return res.status(404).json({ ok: false, error: "Contact not found" });
  res.json(contact);
});

// GET /api/contacts/lead/:leadId — get contact card for a lead
router.get("/api/contacts/lead/:leadId", requireApiKey, (req, res) => {
  const contact = store.getContactByLeadId(req.params.leadId);
  if (!contact) return res.status(404).json({ ok: false, error: "Contact not found for this lead" });
  res.json(contact);
});

// POST /api/contacts
router.post("/api/contacts", requireApiKey, validate(schemas.createContact), (req, res) => {
  const contact = store.createContact(req.body);
  res.status(201).json(contact);
});

// PUT /api/contacts/:id
router.put("/api/contacts/:id", requireApiKey, validate(schemas.updateContact), (req, res) => {
  const contact = store.updateContact(req.params.id, req.body);
  if (!contact) return res.status(404).json({ ok: false, error: "Contact not found" });
  res.json(contact);
});

// DELETE /api/contacts/:id
router.delete("/api/contacts/:id", requireApiKey, (req, res) => {
  const deleted = store.deleteContact(req.params.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "Contact not found" });
  res.json({ ok: true });
});

module.exports = router;
