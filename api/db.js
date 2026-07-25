import { createClient } from "@supabase/supabase-js";

export const surveyOptions = [
  { issue: "Fasilitas Kampus", votes: 42 },
  { issue: "Akademik", votes: 37 },
  { issue: "Kesehatan Mental", votes: 29 },
  { issue: "Transparansi ORMAWA", votes: 25 },
];

let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createHttpError(
      "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diatur di hosting.",
      500,
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

export function cleanValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function cleanMultilineValue(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

export function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function throwIfSupabaseError(error, fallbackMessage = "Server belum siap menerima data.") {
  if (!error) {
    return;
  }

  throw createHttpError(error.message || fallbackMessage, 500);
}

export function sendError(response, error) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Server belum siap menerima data.";

  return response.status(statusCode).json({ error: message });
}
