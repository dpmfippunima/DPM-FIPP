import { ensureSchema, query, sendError, surveyOptions } from "./db.js";

export default async function handler(request, response) {
  try {
    await ensureSchema();

    if (request.method === "GET") {
      const counts = await getCounts();
      return response.status(200).json({ counts });
    }

    if (request.method === "POST") {
      const vote = String(request.body?.vote || "").trim();

      if (!surveyOptions.some(option => option.issue === vote)) {
        return response.status(400).json({ error: "Pilihan survei tidak valid." });
      }

      await query(
        `update survey_votes
         set votes = votes + 1, updated_at = now()
         where issue = $1`,
        [vote]
      );

      const counts = await getCounts();
      return response.status(201).json({ selected: vote, counts });
    }

    return response.status(405).json({ error: "Method tidak diizinkan." });
  } catch (error) {
    return sendError(response, error);
  }
}

async function getCounts() {
  const result = await query(
    "select issue, votes from survey_votes where issue = any($1) order by issue",
    [surveyOptions.map(option => option.issue)]
  );

  return result.rows;
}
