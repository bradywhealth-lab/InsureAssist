# CLAUDE.md — InsureAssist Mock API

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

**InsureAssist Mock API** is a lightweight Express.js server that provides mock HTTP endpoints to support frontend development and integration testing. It satisfies API calls made by the InsureAssist frontend UI — specifically the OnlySales integration settings and lead-sync features.

- **Language:** JavaScript (Node.js, no TypeScript)
- **Framework:** Express 4.x
- **Entry point:** `server.js` (single-file application, ~90 lines)
- **Default port:** `3001`

---

## Repository Structure

```
InsureAssist/
├── server.js          # Entire application — all routes, middleware, and startup
├── package.json       # Project metadata and npm scripts
├── package-lock.json  # Dependency lock file
├── README.md          # Brief usage instructions
└── CLAUDE.md          # This file
```

There are no subdirectories for source, tests, or configuration. All application logic lives in `server.js`.

---

## Development Commands

```bash
npm install        # Install dependencies
npm start          # Run server: node server.js
npm run dev        # Run with auto-reload: nodemon server.js
```

The server logs `Mock API server listening on http://localhost:3001` on startup.

---

## Environment Variables

| Variable | Default  | Description                  |
|----------|----------|------------------------------|
| `PORT`   | `3001`   | Port the HTTP server binds to |

No `.env` file or secrets are required. There is no database connection.

---

## API Endpoints

All responses are JSON. CORS is open (`*`) for all origins, methods, and common headers.

| Method | Path                                    | Description                                              |
|--------|-----------------------------------------|----------------------------------------------------------|
| GET    | `/api/user/preferences`                 | Returns the current in-memory preferences object        |
| POST   | `/api/user/preferences`                 | Merges `body.preferences` into the in-memory store      |
| GET    | `/api/integrations/onlysales/sync`      | Returns hardcoded sync stats and campaign list           |
| POST   | `/api/integrations/onlysales/webhook`   | Logs the webhook body and responds `{ ok: true }`       |
| GET    | `/leads` or `/v1/leads`                 | Mock OnlySales public endpoint; respects `?limit=N`     |
| GET    | `/health`                               | Health check — always returns `{ ok: true }`            |

### Preferences default state (in-memory, resets on restart)

```js
{
  onlysales_enabled: false,
  onlysales_api_key: "",
  onlysales_api_url: "http://localhost:3001",
  auto_sync_leads: true,
  auto_analyze_sentiment: true,
  auto_create_tasks: true,
}
```

POST body format:
```json
{ "preferences": { "onlysales_enabled": true } }
```

---

## Architecture Notes

- **Single-file, no build step.** The server runs directly with `node server.js`. There is no compilation, bundling, or transpilation.
- **In-memory state only.** The `preferences` variable is a plain JS object. All state is lost when the server restarts. There is no database or file persistence.
- **Mock data.** The `/api/integrations/onlysales/sync` endpoint returns static hardcoded values (`synced: 42`, etc.). These are not computed from real data.
- **No authentication.** All endpoints are publicly accessible with no token or session validation.

---

## Code Conventions

- **camelCase** for variables and function parameters.
- **Express middleware** registered with `app.use()` before route handlers.
- **Route handlers** grouped by feature area (preferences, integrations, mock public API).
- **Error handling** uses try/catch with `res.status(400)` for missing input and `res.status(500)` for unexpected errors.
- **JSON responses** throughout; error responses include `{ ok: false, error: "..." }`.
- **No linting or formatting tools** are configured. Match the style of the existing file when making changes.

---

## Testing

There is no automated test suite. Manual testing can be done with curl:

```bash
# Health check
curl http://localhost:3001/health

# Get preferences
curl http://localhost:3001/api/user/preferences

# Update a preference
curl -X POST http://localhost:3001/api/user/preferences \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"onlysales_enabled": true}}'

# Sync stats
curl http://localhost:3001/api/integrations/onlysales/sync

# Mock leads
curl "http://localhost:3001/leads?limit=3"
```

---

## Git Workflow

- Primary development branch: `master`
- AI-generated changes use `claude/` prefixed branches (e.g., `claude/add-claude-documentation-tCPaf`)
- Commit messages should be descriptive and reference the change made
- Always push with `-u origin <branch-name>`

---

## What This Project Is Not

- Not a production API — all data is mock/static
- Not connected to a real OnlySales account or any external service
- Not a full-stack application — this is the backend mock only
- Not tested — no test runner, no test files

When asked to add features, keep changes minimal and consistent with the existing single-file, no-build-step pattern.
