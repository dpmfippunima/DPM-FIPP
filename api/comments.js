import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(request, response) {
  if (request.method === "GET") {
    const discussion = request.query.discussion || "umum";

    const result = await pool.query(
      "select id, discussion, text, created_at from comments where discussion = $1 order by created_at desc limit 50",
      [discussion]
    );

    return response.status(200).json(result.rows);
  }

  if (request.method === "POST") {
    const { discussion, text } = request.body;

    if (!discussion || !text) {
      return response.status(400).json({ error: "Data komentar belum lengkap." });
    }

    const result = await pool.query(
      "insert into comments (discussion, text) values ($1, $2) returning id, discussion, text, created_at",
      [discussion, text]
    );

    return response.status(201).json(result.rows[0]);
  }

  return response.status(405).json({ error: "Method tidak diizinkan." });
}