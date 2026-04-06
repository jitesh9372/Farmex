import { createClient } from "@supabase/supabase-js";

// --- REPLACE THESE WITH YOUR ACTUAL SUPABASE URL AND PUBLIC KEY ---
const SUPABASE_URL = "https://ethbonzkreuliciubrli.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_kkkwIZKxmvCd9-Y8D1W__w_zzm56uFW";
// -------------------------------------------------------------------

/**
 * Supabase client instance for database operations.
 * Replace the constants above with your own credentials from the Supabase dashboard.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
