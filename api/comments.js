import { ensureSchema, query, sendError } from "./db.js";

export default async function handler(request, response) {
  try {
    await ensureSchema();

    if (request.method === "GET") {
      const discussion = cleanValue(request.query.discussion) || "umum";

      const result = await query(
        "select id, discussion, text, created_at from comments where discussion = $1 order by created_at desc limit 50",
        [discussion]
      );

      return response.status(200).json(result.rows);
    }

    if (request.method === "POST") {
      const { discussion, text } = request.body || {};
      const cleanDiscussion = cleanValue(discussion);
      const cleanText = cleanValue(text);

      if (!cleanDiscussion || !cleanText) {
        return response.status(400).json({ error: "Data komentar belum lengkap." });
      }

      const result = await query(
        "insert into comments (discussion, text) values ($1, $2) returning id, discussion, text, created_at",
        [cleanDiscussion, cleanText.slice(0, 1000)]
      );

      return response.status(201).json(result.rows[0]);
    }

    return response.status(405).json({ error: "Method tidak diizinkan." });
  } catch (error) {
    return sendError(response, error);
  }
}

function cleanValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
