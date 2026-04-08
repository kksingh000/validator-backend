const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL === 'your_supabase_project_url') {
  throw new Error(
    'Supabase credentials are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in your .env file.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
