import { Pool } from "pg";

export const surveyOptions = [
  { issue: "Fasilitas Kampus", votes: 42 },
  { issue: "Akademik", votes: 37 },
  { issue: "Kesehatan Mental", votes: 29 },
  { issue: "Transparansi ORMAWA", votes: 25 },
];

const connectionString = process.env.POSTGRES_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
    })
  : null;

let schemaPromise = null;

export async function query(text, params = []) {
  if (!pool) {
    const error = new Error("DATABASE_URL belum diatur di hosting.");
    error.statusCode = 500;
    throw error;
  }

  return pool.query(text, params);
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = createSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

async function createSchema() {
  await query(`
    create table if not exists comments (
      id serial primary key,
      discussion text not null,
      text text not null,
      created_at timestamptz not null default now()
    )
  `);

  await query(`
    create table if not exists aspirations (
      id serial primary key,
      email text not null,
      name text not null,
      nim text not null,
      program_studi text not null,
      aspiration text not null,
      status text not null default 'Baru',
      created_at timestamptz not null default now()
    )
  `);

  await query(`
    create table if not exists survey_votes (
      issue text primary key,
      votes integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `);

  for (const option of surveyOptions) {
    await query(
      `insert into survey_votes (issue, votes)
       values ($1, $2)
       on conflict (issue) do nothing`,
      [option.issue, option.votes],
    );
  }
}

export function sendError(response, error) {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500
      ? error.message || "Server belum siap menerima data."
      : error.message;

  return response.status(statusCode).json({ error: message });
}
