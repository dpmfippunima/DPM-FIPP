import {
  cleanMultilineValue,
  cleanValue,
  createHttpError,
  getSupabase,
  sendError,
  throwIfSupabaseError,
} from "./db.js";

export default async function handler(request, response) {
  try {
    const supabase = getSupabase();

    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method tidak diizinkan." });
    }

    const { email, name, nim, programStudi, program_studi, aspiration } = request.body || {};
    const payload = {
      email: cleanValue(email).slice(0, 160),
      name: cleanValue(name).slice(0, 160),
      nim: cleanValue(nim).slice(0, 80),
      program_studi: cleanValue(programStudi || program_studi).slice(0, 160),
      aspiration: cleanMultilineValue(aspiration).slice(0, 3000),
      status: "Baru",
    };

    if (!payload.email || !payload.name || !payload.nim || !payload.program_studi || !payload.aspiration) {
      throw createHttpError("Data aspirasi belum lengkap.", 400);
    }

    const { data, error } = await supabase
      .from("aspirations")
      .insert(payload)
      .select("id, email, name, nim, program_studi, aspiration, status, created_at")
      .single();

    throwIfSupabaseError(error, "Aspirasi belum bisa disimpan.");

    return response.status(201).json(data);
  } catch (error) {
    return sendError(response, error);
  }
}
