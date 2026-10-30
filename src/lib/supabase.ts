import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const publicKey =
  supabaseAnonKey && supabaseAnonKey !== "your-anon-key"
    ? supabaseAnonKey
    : undefined;
const serverKey =
  supabaseServerKey && !/^your-.*-key$/i.test(supabaseServerKey)
    ? supabaseServerKey
    : undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    (publicKey || serverKey)
  );
};

// Client for public reads / client-side operations (safe for browser)
export const supabasePublic = isSupabaseConfigured()
  ? publicKey
    ? createClient(supabaseUrl!, publicKey)
    : null
  : null;

// Privileged server client (using service role key on server only)
export const getSupabaseServer = () => {
  if (!isSupabaseConfigured()) return null;
  if (!serverKey && process.env.NODE_ENV === "production") {
    throw new Error(
      "Supabase server access is not configured. Set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in the production environment."
    );
  }
  const key = serverKey || publicKey;
  if (!key) return null;
  return createClient(supabaseUrl!, key!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
