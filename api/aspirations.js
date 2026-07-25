import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method tidak diizinkan." });
  }

  const { email, name, nim, programStudi, aspiration } = request.body;

  if (!email || !name || !nim || !programStudi || !aspiration) {
    return response.status(400).json({ error: "Data aspirasi belum lengkap." });
  }

  const result = await pool.query(
    `insert into aspirations (email, name, nim, program_studi, aspiration)
     values ($1, $2, $3, $4, $5)
     returning id, status, created_at`,
    [email, name, nim, programStudi, aspiration]
  );

  return response.status(201).json(result.rows[0]);
}