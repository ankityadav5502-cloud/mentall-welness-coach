import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { patientId } = await req.json();
    if (!patientId) throw new Error("patientId is required");

    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 7);

    const [{ data: moods }, { data: tasks }, { data: journals }] = await Promise.all([
      supabase
        .from("moods")
        .select("value,emoji,created_at,note")
        .eq("user_id", patientId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("dopamine_tasks")
        .select("label,type,done,day")
        .eq("user_id", patientId)
        .gte("day", since.toISOString().slice(0, 10))
        .order("day", { ascending: false }),
      supabase
        .from("journal_entries")
        .select("date,free_text,prompt_win,prompt_feeling,prompt_intention")
        .eq("user_id", patientId)
        .gte("date", since.toISOString().slice(0, 10))
        .order("date", { ascending: false }),
    ]);

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY secret");

    const prompt = `
You are a clinical scribe assistant for a mental wellness app.
Given the last 7 days of patient data, return strict JSON with:
{
  "summary": "2-3 concise sentences",
  "severity": "good" | "warning" | "alert"
}
Use severity=alert for acute risk indicators (e.g. repeated very low mood, SOS events), warning for moderate decline, good for stable/improving.
Data:
${JSON.stringify({ moods: moods ?? [], tasks: tasks ?? [], journals: journals ?? [] })}
`;

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiJson = await aiResponse.json();
    const rawText = aiJson?.output_text ?? "";
    let summary = "No summary available.";
    let severity: "good" | "warning" | "alert" = "good";

    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed?.summary === "string" && parsed.summary.trim().length > 0) {
        summary = parsed.summary;
      }
      if (parsed?.severity === "good" || parsed?.severity === "warning" || parsed?.severity === "alert") {
        severity = parsed.severity;
      }
    } catch {
      summary = rawText || summary;
      severity =
        /alert|urgent|critical/i.test(summary) ? "alert" : /watch|decline|risk|concern/i.test(summary) ? "warning" : "good";
    }

    return new Response(JSON.stringify({ summary, severity }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
