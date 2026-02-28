const { createApp } = require("./src/app");

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port, () => {
  console.log(`Mock API server listening on http://localhost:${port}`);
  if (process.env.API_KEY) {
    console.log(`Auth enabled — use X-API-Key: ${process.env.API_KEY}`);
  } else {
    console.log("Auth disabled — set API_KEY env var to require authentication");
  }
});
