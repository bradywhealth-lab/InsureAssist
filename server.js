const { createApp } = require("./src/app");

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port, () => {
  console.log(`Mock API server listening on http://localhost:${port}`);
  if (process.env.API_KEY) {
    const key = process.env.API_KEY;
    const masked = key.length > 4 ? "*".repeat(key.length - 4) + key.slice(-4) : "****";
    console.log(`Auth enabled — API key configured (${masked})`);
  } else {
    console.log("Auth disabled — set API_KEY env var to require authentication");
  }
});
