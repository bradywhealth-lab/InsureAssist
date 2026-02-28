const store = require("../src/store");

// Reset the in-memory store before every test so state never bleeds between cases
beforeEach(() => {
  store._reset();
  delete process.env.API_KEY;
});
