import {
  cleanValue,
  createHttpError,
  getSupabase,
  sendError,
  throwIfSupabaseError,
} from "./db.js";

export default async function handler(request, response) {
  try {
    const supabase = getSupabase();

    if (request.method === "GET") {
      const discussion = cleanValue(request.query?.discussion) || "umum";

      const { data, error } = await supabase
        .from("comments")
        .select("id, discussion, text, created_at")
        .eq("discussion", discussion)
        .order("created_at", { ascending: false })
        .limit(50);

      throwIfSupabaseError(error, "Komentar belum bisa dimuat.");

      return response.status(200).json(data || []);
    }

    if (request.method === "POST") {
      const { discussion, text } = request.body || {};

      const payload = {
        discussion: cleanValue(discussion),
        text: cleanValue(text).slice(0, 1000),
      };

      if (!payload.discussion || !payload.text) {
        throw createHttpError("Data komentar belum lengkap.", 400);
      }

      const { data, error } = await supabase
        .from("comments")
        .insert(payload)
        .select("id, discussion, text, created_at")
        .single();

      throwIfSupabaseError(error, "Komentar belum bisa disimpan.");

      return response.status(201).json(data);
    }

    return response.status(405).json({
      error: "Method tidak diizinkan.",
    });

  } catch (error) {
    return sendError(response, error);
  }
}