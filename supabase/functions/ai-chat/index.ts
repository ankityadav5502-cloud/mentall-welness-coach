import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Sage, a warm AI wellness companion in "Upward Spiral" app.
You have the user's personal data AND mental health knowledge base as context.
RULES:
- Never diagnose or prescribe. For crises: Tele MANAS 14416, iCall 9152987821
- Reference specific journal entries/moods when relevant
- Keep responses 2-4 paragraphs. Use gentle emojis sparingly.
- For medication questions: share general info but say "consult your psychiatrist"`;

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!resp.ok) throw new Error(`Embedding error: ${resp.status}`);
  const json = await resp.json();
  return json.data[0].embedding;
}

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

    const { sessionId, message } = await req.json();
    if (!message) throw new Error("message is required");

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY secret");

    // 1. Get or create session
    let sid = sessionId;
    if (!sid) {
      const { data: s, error } = await supabase.from("ai_chat_sessions")
        .insert({ user_id: user.id }).select("id").single();
      if (error) throw error;
      sid = s.id;
    }

    // 2. Embed query
    const qEmbed = await getEmbedding(message, openaiApiKey);

    // 3. Vector search: personal docs + knowledge base
    // Pass embedding as number[] — PostgREST maps it to pgvector; JSON.stringify breaks retrieval.
    const [personalRes, knowledgeRes] = await Promise.all([
      supabase.rpc("match_user_documents", {
        query_embedding: qEmbed,
        match_user_id: user.id,
        match_count: 5,
        match_threshold: 0.35,
      }),
      supabase.rpc("match_knowledge", {
        query_embedding: qEmbed,
        match_count: 5,
        match_threshold: 0.35,
      }),
    ]);
    if (personalRes.error) console.error("match_user_documents:", personalRes.error.message);
    if (knowledgeRes.error) console.error("match_knowledge:", knowledgeRes.error.message);
    const personalDocs = personalRes.data ?? [];
    const knowledgeDocs = knowledgeRes.data ?? [];

    // 4. Structured context
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const [{ data: moods }, { data: meds }, { data: tasks }] = await Promise.all([
      supabase.from("moods").select("emoji,value,note,created_at").eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString()).order("created_at", { ascending: false }).limit(14),
      supabase.from("medications").select("name,dosage,frequency").eq("user_id", user.id).eq("active", true),
      supabase.from("dopamine_tasks").select("label,done,day").eq("user_id", user.id)
        .gte("day", weekAgo.toISOString().slice(0, 10)).limit(20),
    ]);

    // 5. Chat history
    const { data: history } = await supabase.from("ai_chat_messages")
      .select("role,content").eq("session_id", sid).order("created_at").limit(20);

    // 6. Build context
    const ctx: string[] = [];
    if (personalDocs?.length) {
      ctx.push("=== USER'S RELEVANT ENTRIES ===");
      personalDocs.forEach((d: any) => ctx.push(`[${d.source_type} ${d.metadata?.date || ""}] ${d.content}`));
    }
    if (knowledgeDocs?.length) {
      ctx.push("\n=== MENTAL HEALTH KNOWLEDGE ===");
      knowledgeDocs.forEach((d: any) => ctx.push(`[${d.category}: ${d.title}]\n${d.content}`));
    }
    if (moods?.length) {
      ctx.push("\n=== MOOD TREND (7 days) ===");
      moods.forEach((m: any) => ctx.push(`${m.created_at.slice(0,10)}: ${m.emoji} ${m.value}/5${m.note ? ' "' + m.note + '"' : ""}`));
      ctx.push(`Avg: ${(moods.reduce((s: number, m: any) => s + m.value, 0) / moods.length).toFixed(1)}/5`);
    }
    if (meds?.length) {
      ctx.push("\n=== ACTIVE MEDICATIONS ===");
      meds.forEach((m: any) => ctx.push(`• ${m.name} ${m.dosage} (${m.frequency})`));
    }
    if (tasks?.length) {
      const done = tasks.filter((t: any) => t.done).length;
      ctx.push(`\n=== TASKS === ${done}/${tasks.length} completed this week`);
    }

    const uniqueSources: { category: string; title: string }[] = [];
    if (knowledgeDocs?.length) {
      const seen = new Set();
      knowledgeDocs.forEach((d: any) => {
        const key = `${d.category}|${d.title}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueSources.push({ category: d.category, title: d.title });
        }
      });
    }

    const ctxBlock = ctx.length ? `\n\n--- CONTEXT ---\n${ctx.join("\n")}\n--- END ---` : "\n\n(New user, no data yet.)";

    // 7. Call OpenAI with STREAM = true
    const msgs: any[] = [{ role: "system", content: SYSTEM_PROMPT + ctxBlock }];
    if (history?.length) history.forEach((m: any) => msgs.push({ role: m.role, content: m.content }));
    msgs.push({ role: "user", content: message });

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4.1-mini", messages: msgs, temperature: 0.7, max_tokens: 1000, stream: true }),
    });

    if (!aiResp.ok) throw new Error(`OpenAI error: ${await aiResp.text()}`);

    // Generate title if new session
    const titlePromise = !sessionId ? fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini", temperature: 0.5, max_tokens: 20,
        messages: [
          { role: "system", content: "Generate a 3-6 word title. Return ONLY the title." },
          { role: "user", content: message },
        ],
      }),
    }).then(res => res.json()).then(json => json.choices?.[0]?.message?.content?.trim()) : Promise.resolve(undefined);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullReply = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const title = await titlePromise;
          if (!sessionId && title) {
            await supabase.from("ai_chat_sessions").update({ title, updated_at: new Date().toISOString() }).eq("id", sid);
          } else {
            await supabase.from("ai_chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sid);
          }

          // Send metadata first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', sessionId: sid, title })}\n\n`));

          // Send sources
          if (uniqueSources.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: uniqueSources })}\n\n`));
          }

          // Stream chunks from OpenAI
          const reader = aiResp.body?.getReader();
          if (reader) {
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              // Keep the last incomplete line in the buffer
              buffer = lines.pop() || "";
              
              for (const line of lines) {
                if (line.startsWith("data: ") && line !== "data: [DONE]") {
                  try {
                    const data = JSON.parse(line.slice(6));
                    const text = data.choices[0]?.delta?.content || "";
                    if (text) {
                      fullReply += text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
                    }
                  } catch (e) {
                    // Ignore parse errors on chunks
                  }
                }
              }
            }
          }
          
          // Save to database
          await supabase.from("ai_chat_messages").insert([
            { session_id: sid, role: "user", content: message },
            { session_id: sid, role: "assistant", content: fullReply },
          ]);

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: (err as Error).message })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
