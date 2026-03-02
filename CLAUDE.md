# CLAUDE.md — InsureAssist CRM Platform

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

**InsureAssist** is an AI-powered CRM platform built for insurance agents. It serves as a personal assistant for daily scheduling, lead management, automated outreach, and marketing automation. The backend is a Node.js/Express API with in-memory state, designed for rapid development and frontend integration.

- **Language:** JavaScript (Node.js, no TypeScript)
- **Framework:** Express 4.x
- **Entry point:** `server.js`
- **Default port:** `3001`
- **Version:** 3.0.0

---

## Repository Structure

```
InsureAssist/
├── server.js                      # Server startup
├── package.json                   # Project metadata and npm scripts
├── package-lock.json              # Dependency lock file
├── README.md                      # Usage instructions
├── CLAUDE.md                      # This file
├── .gitignore                     # Git ignore rules
├── src/
│   ├── app.js                     # Express app factory & middleware stack
│   ├── store.js                   # In-memory data store (all models)
│   ├── middleware/
│   │   ├── auth.js                # Optional API key authentication
│   │   ├── rateLimiter.js         # Rate limiting (standard/strict)
│   │   └── validate.js            # Joi schema validation (all models)
│   └── routes/
│       ├── health.js              # Health check
│       ├── auth.js                # Token generation
│       ├── preferences.js         # User preferences
│       ├── leads.js               # Lead CRUD + filtering
│       ├── campaigns.js           # Campaign CRUD
│       ├── integrations.js        # OnlySales sync, webhooks, analytics
│       ├── tags.js                # Tags CRUD + lead tagging & disposition
│       ├── contacts.js            # Contact cards with rich metadata
│       ├── tasks.js               # Tasks, scheduling, daily planner
│       ├── messages.js            # SMS/texting, bulk messaging, conversations
│       ├── followups.js           # Automated follow-up sequences
│       ├── csv.js                 # CSV upload with source tracking
│       ├── scraping.js            # Web scraping for lead generation
│       ├── marketing.js           # Social media & marketing automation
│       └── ai.js                  # AI insights, lead scoring, recommendations
└── tests/
    ├── setup.js                   # Global test setup (store reset)
    ├── health.test.js             # Health endpoint tests
    ├── auth.test.js               # Authentication tests
    ├── preferences.test.js        # Preferences tests
    ├── leads.test.js              # Leads CRUD tests
    ├── campaigns.test.js          # Campaigns tests
    ├── integrations.test.js       # Integration tests
    ├── security.test.js           # Security tests
    ├── tags.test.js               # Tags & disposition tests
    ├── contacts.test.js           # Contact cards tests
    ├── tasks.test.js              # Tasks & scheduling tests
    ├── messages.test.js           # Messaging & texting tests
    ├── followups.test.js          # Follow-up automation tests
    ├── csv.test.js                # CSV upload tests
    ├── scraping.test.js           # Web scraping tests
    ├── marketing.test.js          # Marketing automation tests
    └── ai.test.js                 # AI insights & scoring tests
```

---

## Development Commands

```bash
npm install            # Install dependencies
npm start              # Run server: node server.js
npm run dev            # Run with auto-reload: nodemon server.js
npm test               # Run all 231 tests
npm run test:coverage  # Run tests with coverage report
```

---

## Environment Variables

| Variable      | Default  | Description                                        |
|---------------|----------|----------------------------------------------------|
| `PORT`        | `3001`   | Port the HTTP server binds to                      |
| `API_KEY`     | (unset)  | Enables authentication when set                    |
| `CORS_ORIGIN` | (unset)  | Comma-separated allowed origins; defaults to `*`   |
| `NODE_ENV`    | (unset)  | Set to `test` for testing (disables logging/rate-limiting) |

---

## Core Features

### 1. Lead Management
- Full CRUD for leads with pagination and filtering
- Filter by: status, campaign_id, disposition, tag
- CSV upload with automatic source tracking (filename + upload date on each lead)
- Bulk lead creation from CSV-like payloads
- Lead dispositions: new, contacted, qualified, unqualified, appointment_set, no_answer, callback, sold, lost, dnc

### 2. Tags & Disposition System
- CRUD for tags (name + color)
- Add/remove tags on leads
- Set lead disposition (quick-disposition endpoint)
- Filter leads by tag

### 3. Contact Cards
- Rich contact cards linked to leads
- Fields: first_name, last_name, email, phone, address, date_of_birth
- Labels array for categorization
- Custom fields (key-value pairs)
- CSV source metadata (which file, when uploaded)
- Lookup contact by lead_id

### 4. Tasks & Daily Scheduling
- Full CRUD for tasks
- Task types: follow_up, call, appointment, meeting, email, sms, general
- Priority levels: low, medium, high, urgent
- Daily schedule view (GET /api/tasks/daily?date=YYYY-MM-DD)
- Quick-complete endpoint
- Filter by status, type, priority, due_before, due_after
- Auto-sorted by due_date

### 5. Automated Texting & Messaging
- Send individual SMS messages
- Bulk messaging to multiple leads at once
- Conversation thread view per lead
- Auto-updates lead's last_contacted_at on outbound messages
- Message statuses: queued, sent, delivered, failed, received
- Filter by lead_id, contact_id, direction, channel

### 6. Follow-up Sequences
- Create multi-step follow-up sequences (SMS, email, call steps)
- Advance through steps automatically
- Pause/resume sequences
- Configurable delay between steps (via preferences)
- Track completion status per step

### 7. CSV Upload & Source Tracking
- Upload leads via JSON payload (simulates CSV parsing)
- Each imported lead tagged with csv_source: { filename, uploaded_at, upload_id }
- Skip rows with missing required fields
- Track upload stats: rows_total, rows_imported, rows_skipped
- View upload history

### 8. Web Scraping (Lead Generation)
- Create scraping jobs targeting URLs/directories
- Mock scraping simulation (completes after ~100ms)
- Import scraped results as leads (auto-tagged with "scraped")
- Track job status: queued → completed

### 9. Marketing & Social Media Automation
- Create marketing campaigns for: facebook, instagram, twitter, linkedin, tiktok, google, email
- Campaign types: ad, post, story, reel, email_blast, drip
- Schedule configuration (frequency, time, timezone)
- Quick activate/pause endpoints
- Track metrics: impressions, clicks, conversions

### 10. AI Learning & Insights
- AI lead scoring (0-100) based on status, disposition, tags, and engagement
- Contextual recommendations per lead (next best action)
- Score all leads at once
- AI dashboard with summary, action items, hot leads
- Insights stored and queryable

---

## API Endpoints (60+)

### Health & Auth
| Method | Path                    | Description                |
|--------|-------------------------|----------------------------|
| GET    | `/health`               | Health check               |
| POST   | `/api/auth/token`       | Mock token generation      |

### Preferences
| Method | Path                      | Description              |
|--------|---------------------------|--------------------------|
| GET    | `/api/user/preferences`   | Get current preferences  |
| POST   | `/api/user/preferences`   | Update preferences       |

### Leads
| Method | Path                                | Description                           |
|--------|-------------------------------------|---------------------------------------|
| GET    | `/api/leads`                        | List leads (filter: status, disposition, tag, campaign_id) |
| GET    | `/api/leads/:id`                    | Get single lead                       |
| POST   | `/api/leads`                        | Create lead                           |
| PUT    | `/api/leads/:id`                    | Update lead                           |
| DELETE | `/api/leads/:id`                    | Delete lead                           |
| POST   | `/api/leads/:id/tags`               | Add tag to lead                       |
| DELETE | `/api/leads/:id/tags/:tagName`      | Remove tag from lead                  |
| PUT    | `/api/leads/:id/disposition`        | Set lead disposition                  |
| GET    | `/leads`, `/v1/leads`               | Legacy public endpoint                |

### Tags
| Method | Path              | Description      |
|--------|-------------------|------------------|
| GET    | `/api/tags`       | List all tags    |
| GET    | `/api/tags/:id`   | Get tag          |
| POST   | `/api/tags`       | Create tag       |
| PUT    | `/api/tags/:id`   | Update tag       |
| DELETE | `/api/tags/:id`   | Delete tag       |

### Contacts
| Method | Path                              | Description                  |
|--------|-----------------------------------|------------------------------|
| GET    | `/api/contacts`                   | List contacts (filter: label)|
| GET    | `/api/contacts/:id`               | Get contact card             |
| GET    | `/api/contacts/lead/:leadId`      | Get contact for a lead       |
| POST   | `/api/contacts`                   | Create contact               |
| PUT    | `/api/contacts/:id`               | Update contact               |
| DELETE | `/api/contacts/:id`               | Delete contact               |

### Tasks & Scheduling
| Method | Path                        | Description                  |
|--------|-----------------------------|------------------------------|
| GET    | `/api/tasks`                | List tasks (many filters)    |
| GET    | `/api/tasks/daily`          | Daily schedule view          |
| GET    | `/api/tasks/:id`            | Get task                     |
| POST   | `/api/tasks`                | Create task                  |
| PUT    | `/api/tasks/:id`            | Update task                  |
| PUT    | `/api/tasks/:id/complete`   | Quick-complete task          |
| DELETE | `/api/tasks/:id`            | Delete task                  |

### Messages / Texting
| Method | Path                                     | Description                    |
|--------|------------------------------------------|--------------------------------|
| GET    | `/api/messages`                          | List messages (many filters)   |
| GET    | `/api/messages/:id`                      | Get message                    |
| POST   | `/api/messages`                          | Send a message                 |
| GET    | `/api/messages/conversation/:leadId`     | Conversation thread for lead   |
| POST   | `/api/messages/bulk`                     | Bulk send to multiple leads    |

### Follow-ups
| Method | Path                              | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/followups`                  | List follow-up sequences       |
| GET    | `/api/followups/:id`              | Get sequence                   |
| POST   | `/api/followups`                  | Create sequence                |
| PUT    | `/api/followups/:id/advance`      | Advance to next step           |
| PUT    | `/api/followups/:id/pause`        | Pause sequence                 |
| PUT    | `/api/followups/:id/resume`       | Resume sequence                |
| DELETE | `/api/followups/:id`              | Delete sequence                |

### CSV Uploads
| Method | Path                    | Description                    |
|--------|-------------------------|--------------------------------|
| GET    | `/api/csv-uploads`      | List all uploads               |
| GET    | `/api/csv-uploads/:id`  | Get upload details             |
| POST   | `/api/csv-uploads`      | Upload leads from CSV          |

### Scraping
| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/api/scraping`               | List scraping jobs             |
| GET    | `/api/scraping/:id`           | Get job details                |
| POST   | `/api/scraping`               | Create scraping job            |
| POST   | `/api/scraping/:id/import`    | Import results as leads        |
| DELETE | `/api/scraping/:id`           | Delete job                     |

### Marketing
| Method | Path                              | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/marketing`                  | List campaigns (filter: platform, status) |
| GET    | `/api/marketing/:id`              | Get campaign                   |
| POST   | `/api/marketing`                  | Create campaign                |
| PUT    | `/api/marketing/:id`              | Update campaign                |
| PUT    | `/api/marketing/:id/activate`     | Quick-activate                 |
| PUT    | `/api/marketing/:id/pause`        | Quick-pause                    |
| DELETE | `/api/marketing/:id`              | Delete campaign                |

### AI & Insights
| Method | Path                                  | Description                    |
|--------|---------------------------------------|--------------------------------|
| GET    | `/api/ai/insights`                    | List all insights              |
| GET    | `/api/ai/insights/:id`                | Get insight                    |
| POST   | `/api/ai/score/:leadId`               | Generate AI lead score         |
| POST   | `/api/ai/score-all`                   | Score all leads                |
| GET    | `/api/ai/recommendations/:leadId`     | Get AI recommendations         |
| GET    | `/api/ai/dashboard`                   | AI-powered dashboard summary   |

### Integrations & Analytics
| Method | Path                                      | Description                    |
|--------|-------------------------------------------|--------------------------------|
| GET    | `/api/integrations/onlysales/sync`        | Sync stats                     |
| GET    | `/api/integrations/onlysales/status`      | Connection status              |
| POST   | `/api/integrations/onlysales/webhook`     | Webhook endpoint               |
| GET    | `/api/analytics`                          | Full analytics rollup          |

---

## Architecture Notes

- **Modular route structure.** Each feature area has its own route file in `src/routes/`.
- **App factory pattern.** `createApp()` in `src/app.js` allows multiple test instances.
- **In-memory state only.** All data resets on server restart. No database.
- **Joi validation** on all POST/PUT request bodies.
- **Optional API key auth.** Set `API_KEY` env var to require authentication.
- **No build step.** Pure Node.js, runs directly with `node server.js`.

---

## Code Conventions

- **camelCase** for variables and function parameters.
- **Express middleware** registered with `app.use()` before route handlers.
- **Route handlers** grouped by feature area in separate files.
- **Error handling** uses try/catch with appropriate HTTP status codes.
- **JSON responses** throughout; error responses include `{ ok: false, error: "..." }`.
- **No linting or formatting tools** are configured. Match existing style.

---

## Testing

```bash
npm test               # Run all 231 tests (16 test suites)
npm run test:coverage  # Run with coverage report
```

Test suites cover: health, auth, preferences, leads, campaigns, integrations, security, tags, contacts, tasks, messages, followups, csv uploads, scraping, marketing, and AI insights.

---

## Git Workflow

- Primary development branch: `master`
- AI-generated changes use `claude/` prefixed branches
- Commit messages should be descriptive and reference the change made
- Always push with `-u origin <branch-name>`
