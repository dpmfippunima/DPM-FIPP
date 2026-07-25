import {
  cleanValue,
  createHttpError,
  getSupabase,
  sendError,
  surveyOptions,
  throwIfSupabaseError,
} from "./db.js";

export default async function handler(request, response) {
  try {
    const supabase = getSupabase();

    if (request.method === "GET") {
      const counts = await getCounts(supabase);
      return response.status(200).json({ counts });
    }

    if (request.method === "POST") {
      const issue = cleanValue(request.body?.issue || request.body?.vote);

      if (!surveyOptions.some((option) => option.issue === issue)) {
        throw createHttpError("Pilihan survei tidak valid.", 400);
      }

      const currentVotes = await getCurrentVotes(supabase, issue);
      const { error } = await supabase
        .from("survey_votes")
        .update({
          votes: currentVotes + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("issue", issue);

      throwIfSupabaseError(error, "Suara belum bisa disimpan.");

      const counts = await getCounts(supabase);
      return response.status(201).json({ selected: issue, counts });
    }

    return response.status(405).json({ error: "Method tidak diizinkan." });
  } catch (error) {
    return sendError(response, error);
  }
}

async function getCounts(supabase) {
  await ensureSurveyRows(supabase);

  const { data, error } = await supabase
    .from("survey_votes")
    .select("issue, votes, updated_at")
    .order("issue", { ascending: true });

  throwIfSupabaseError(error, "Data survei belum bisa dimuat.");

  return data || [];
}

async function getCurrentVotes(supabase, issue) {
  await ensureSurveyRows(supabase);

  const { data, error } = await supabase
    .from("survey_votes")
    .select("votes")
    .eq("issue", issue)
    .single();

  throwIfSupabaseError(error, "Data survei belum bisa dimuat.");

  return Number(data?.votes || 0);
}

async function ensureSurveyRows(supabase) {
  const { data, error } = await supabase
    .from("survey_votes")
    .select("issue")
    .limit(1);

  throwIfSupabaseError(error, "Data survei belum bisa dimuat.");

  if (data && data.length > 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("survey_votes")
    .upsert(surveyOptions, {
      onConflict: "issue",
      ignoreDuplicates: true,
    });

  throwIfSupabaseError(insertError, "Data survei belum bisa dibuat.");
}
