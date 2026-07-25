import { ensureSchema, query, sendError } from "./db.js";

export default async function handler(request, response) {
  try {
    await ensureSchema();

    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method tidak diizinkan." });
    }

    const { email, name, nim, programStudi, aspiration } = request.body || {};
    const payload = {
      email: cleanValue(email),
      name: cleanValue(name),
      nim: cleanValue(nim),
      programStudi: cleanValue(programStudi),
      aspiration: cleanMultilineValue(aspiration),
    };

    if (!payload.email || !payload.name || !payload.nim || !payload.programStudi || !payload.aspiration) {
      return response.status(400).json({ error: "Data aspirasi belum lengkap." });
    }

    const result = await query(
      `insert into aspirations (email, name, nim, program_studi, aspiration)
       values ($1, $2, $3, $4, $5)
       returning id, created_at`,
      [
        payload.email.slice(0, 160),
        payload.name.slice(0, 160),
        payload.nim.slice(0, 80),
        payload.programStudi.slice(0, 160),
        payload.aspiration.slice(0, 3000),
      ]
    );

    return response.status(201).json(result.rows[0]);
  } catch (error) {
    return sendError(response, error);
  }
}

function cleanValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanMultilineValue(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}
