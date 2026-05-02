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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { entryId } = await req.json();
    if (!entryId) throw new Error("entryId is required");

    // Check for cached reflection
    const { data: cached } = await supabase.from("journal_reflections")
      .select("reflection, themes").eq("journal_entry_id", entryId).maybeSingle();
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the target entry
    const { data: entry, error: entryErr } = await supabase.from("journal_entries")
      .select("*").eq("id", entryId).eq("user_id", user.id).single();
    if (entryErr || !entry) throw new Error("Entry not found");

    // Fetch recent entries for pattern detection
    const { data: recentEntries } = await supabase.from("journal_entries")
      .select("date, free_text, prompt_win, prompt_feeling, prompt_intention")
      .eq("user_id", user.id).neq("id", entryId)
      .order("date", { ascending: false }).limit(7);

    // Build prompt
    const entryText = [
      entry.free_text ? `Free write: ${entry.free_text}` : "",
      entry.prompt_win ? `Small win: ${entry.prompt_win}` : "",
      entry.prompt_feeling ? `Feeling: ${entry.prompt_feeling}` : "",
      entry.prompt_intention ? `Intention: ${entry.prompt_intention}` : "",
    ].filter(Boolean).join("\n");

    const recentText = (recentEntries || []).map((e: any) =>
      `[${e.date}] ${[e.free_text, e.prompt_win, e.prompt_feeling, e.prompt_intention].filter(Boolean).join(" | ")}`
    ).join("\n");

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY secret");

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini", temperature: 0.6, max_tokens: 600,
        messages: [
          {
            role: "system",
            content: `You are a reflective therapist companion. The user just wrote a journal entry. Your job:
1. Gently mirror what they expressed — show you understood.
2. Identify 2-4 emotional themes (single words like "gratitude", "anxiety", "hope", "growth").
3. If recent entries show patterns, mention them ("I notice over the past few days...").
4. Offer a gentle reframe or encouragement. Celebrate growth.
5. Keep it warm, 2-3 paragraphs max.

Return strict JSON: { "reflection": "...", "themes": ["theme1", "theme2"] }`,
          },
          {
            role: "user",
            content: `TODAY'S ENTRY (${entry.date}):\n${entryText}\n\nRECENT ENTRIES:\n${recentText || "No recent entries."}`,
          },
        ],
      }),
    });

    if (!aiResp.ok) throw new Error(`OpenAI error: ${aiResp.status}`);
    const aiJson = await aiResp.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "";

    let reflection = "Your thoughts are valid and important. Keep journaling! 🌱";
    let themes: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (parsed.reflection) reflection = parsed.reflection;
      if (Array.isArray(parsed.themes)) themes = parsed.themes;
    } catch {
      reflection = raw || reflection;
    }

    // Cache the reflection
    await supabase.from("journal_reflections").insert({
      user_id: user.id, journal_entry_id: entryId, reflection, themes,
    });

    return new Response(JSON.stringify({ reflection, themes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
