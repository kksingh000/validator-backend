require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const ideasRouter = require("./routes/ideas");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ────────────────────────
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate-limit: 30 requests / minute per IP
app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests — slow down." },
  })
);

// ── Health check ─────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    service: "Startup Idea Validator API",
    version: "1.0.0",
    status: "ok",
    endpoints: {
      "POST   /api/ideas": "Submit an idea & trigger AI analysis",
      "GET    /api/ideas": "List all ideas (paginated)",
      "GET    /api/ideas/:id": "Get full analysis report",
      "DELETE /api/ideas/:id": "Delete an idea",
      "POST   /api/ideas/:id/retry": "Re-run AI analysis for a failed idea",
    },
  });
});

// ── Debug: check env vars are loaded ─────────
app.get("/debug/env", (_req, res) => {
  res.json({
    gemini_key_set: !!process.env.GEMINI_API_KEY,
    gemini_key_prefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 8) + "..." : "NOT SET",
    supabase_url_set: !!process.env.SUPABASE_URL,
    node_env: process.env.NODE_ENV || "not set",
  });
});

// ── Routes ───────────────────────────────────
app.use("/api/ideas", ideasRouter);

// ── 404 catch-all ────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// ── Error handler ────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Startup Idea Validator API running on http://localhost:${PORT}\n`);
});

module.exports = app;
