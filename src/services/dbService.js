const supabase = require("../config/supabase");

const TABLE = "ideas";

// ---------- Create ----------
async function createIdea({ title, description, industry, target_market }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title,
      description,
      industry: industry || null,
      target_market: target_market || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------- Update status & analysis ----------
async function updateIdeaStatus(id, status, analysis = null) {
  const update = { status };
  if (analysis !== null) update.analysis = analysis;

  const { data, error } = await supabase
    .from(TABLE)
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------- Get all ----------
async function getAllIdeas({ page = 1, limit = 20, status } = {}) {
  let query = supabase
    .from(TABLE)
    .select("id, title, description, industry, target_market, status, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    ideas: data,
    pagination: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
}

// ---------- Get by ID ----------
async function getIdeaById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

// ---------- Delete ----------
async function deleteIdea(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

module.exports = {
  createIdea,
  updateIdeaStatus,
  getAllIdeas,
  getIdeaById,
  deleteIdea,
};
