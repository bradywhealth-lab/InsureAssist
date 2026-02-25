Mock API for InsureAssist

This project provides a simple Express mock API to satisfy frontend calls to:

- `GET /api/user/preferences`
- `POST /api/user/preferences`
- `GET /api/integrations/onlysales/sync`
- `POST /api/integrations/onlysales/webhook`
- `GET /leads?limit=1` (mock OnlySales public endpoint)

Run locally:

```bash
npm install
npm start
# or for development with auto-reload:
npm run dev
```

The server listens on `PORT` (default `3001`). If your frontend runs on a different port,
set the `settings.onlysales_api_url` to `http://localhost:3001` in the UI so `Test Connection` succeeds.
# InsureAssist