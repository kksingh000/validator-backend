const db = require("../services/dbService");
const { analyzeIdea } = require("../services/aiService");

// ──────────────────────────────────────────────
// POST /api/ideas  —  submit idea & trigger AI
// ──────────────────────────────────────────────
async function createIdea(req, res) {
  try {
    const { title, description, industry, target_market } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "title and description are required.",
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        error: "title must be 200 characters or fewer.",
      });
    }

    if (description.length > 5000) {
      return res.status(400).json({
        success: false,
        error: "description must be 5 000 characters or fewer.",
      });
    }

    // 1. Persist idea with status "analyzing"
    const idea = await db.createIdea({ title, description, industry, target_market });
    await db.updateIdeaStatus(idea.id, "analyzing");

    // 2. Run AI analysis (fire-and-await so the caller gets the full report)
    try {
      const analysis = await analyzeIdea({ title, description, industry, target_market });
      const completed = await db.updateIdeaStatus(idea.id, "completed", analysis);

      return res.status(201).json({
        success: true,
        data: completed,
      });
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr.message);
      await db.updateIdeaStatus(idea.id, "failed");

      return res.status(201).json({
        success: true,
        data: await db.getIdeaById(idea.id),
        warning: "Idea saved but AI analysis failed. You can retry later.",
      });
    }
  } catch (err) {
    console.error("createIdea error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// ──────────────────────────────────────────────
// GET /api/ideas  —  list ideas (paginated)
// ──────────────────────────────────────────────
async function listIdeas(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const status = req.query.status || undefined;

    const result = await db.getAllIdeas({ page, limit, status });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("listIdeas error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// ──────────────────────────────────────────────
// GET /api/ideas/:id  —  full report
// ──────────────────────────────────────────────
async function getIdea(req, res) {
  try {
    const { id } = req.params;
    const idea = await db.getIdeaById(id);

    if (!idea) {
      return res.status(404).json({ success: false, error: "Idea not found." });
    }

    return res.json({ success: true, data: idea });
  } catch (err) {
    console.error("getIdea error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// ──────────────────────────────────────────────
// DELETE /api/ideas/:id
// ──────────────────────────────────────────────
async function deleteIdea(req, res) {
  try {
    const { id } = req.params;
    const deleted = await db.deleteIdea(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Idea not found." });
    }

    return res.json({ success: true, message: "Idea deleted.", data: { id } });
  } catch (err) {
    console.error("deleteIdea error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// ──────────────────────────────────────────────
// POST /api/ideas/:id/retry  —  re-run analysis
// ──────────────────────────────────────────────
async function retryAnalysis(req, res) {
  try {
    const { id } = req.params;
    const idea = await db.getIdeaById(id);

    if (!idea) {
      return res.status(404).json({ success: false, error: "Idea not found." });
    }

    if (idea.status === "analyzing") {
      return res.status(409).json({ success: false, error: "Analysis already in progress." });
    }

    await db.updateIdeaStatus(id, "analyzing");

    try {
      const analysis = await analyzeIdea(idea);
      const completed = await db.updateIdeaStatus(id, "completed", analysis);
      return res.json({ success: true, data: completed });
    } catch (aiErr) {
      console.error("retryAnalysis AI error:", aiErr);
      await db.updateIdeaStatus(id, "failed");
      return res.status(500).json({
        success: false,
        error: "AI analysis failed. Try again later.",
        debug_error: aiErr.message || String(aiErr),
      });
    }
  } catch (err) {
    console.error("retryAnalysis error:", err);
    return res.status(500).json({ success: false, error: "Internal server error.", debug_error: err.message });
  }
}

module.exports = {
  createIdea,
  listIdeas,
  getIdea,
  deleteIdea,
  retryAnalysis,
};
