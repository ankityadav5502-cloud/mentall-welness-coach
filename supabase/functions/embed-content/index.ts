import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { sourceType, sourceId } = await req.json();
    if (!sourceType || !sourceId) {
      throw new Error("sourceType and sourceId are required");
    }

    // ── Fetch source content ──────────────────────────────────
    let textContent = "";
    let metadata: Record<string, unknown> = {};

    if (sourceType === "journal") {
      const { data: entry, error } = await supabase
        .from("journal_entries")
        .select("free_text, prompt_win, prompt_feeling, prompt_intention, date")
        .eq("id", sourceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!entry) throw new Error("Journal entry not found");

      // Combine all text fields into one document
      const parts: string[] = [];
      if (entry.free_text) parts.push(`Journal: ${entry.free_text}`);
      if (entry.prompt_win) parts.push(`Small win: ${entry.prompt_win}`);
      if (entry.prompt_feeling) parts.push(`Feeling: ${entry.prompt_feeling}`);
      if (entry.prompt_intention)
        parts.push(`Intention: ${entry.prompt_intention}`);
      textContent = parts.join("\n");
      metadata = { date: entry.date, type: "journal" };
    } else if (sourceType === "mood") {
      const { data: mood, error } = await supabase
        .from("moods")
        .select("emoji, value, note, created_at")
        .eq("id", sourceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!mood) throw new Error("Mood entry not found");

      textContent = `Mood: ${mood.emoji} (${mood.value}/5)`;
      if (mood.note) textContent += ` — ${mood.note}`;
      metadata = {
        date: mood.created_at,
        mood_value: mood.value,
        type: "mood",
      };
    } else {
      throw new Error(`Unsupported sourceType: ${sourceType}`);
    }

    if (!textContent.trim()) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "empty content" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Generate embedding via OpenAI ─────────────────────────
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY secret");

    const embeddingResponse = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: textContent,
        }),
      }
    );

    if (!embeddingResponse.ok) {
      const errText = await embeddingResponse.text();
      throw new Error(`OpenAI Embeddings API error: ${errText}`);
    }

    const embeddingJson = await embeddingResponse.json();
    const embedding = embeddingJson.data?.[0]?.embedding;
    if (!embedding) throw new Error("No embedding returned");

    // ── Upsert into document_embeddings ───────────────────────
    const { error: upsertError } = await supabase
      .from("document_embeddings")
      .upsert(
        {
          user_id: user.id,
          source_type: sourceType,
          source_id: sourceId,
          content: textContent,
          embedding,
          metadata,
        },
        { onConflict: "source_type,source_id" }
      );

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
