import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY secret");

    // Fetch all knowledge documents without embeddings
    const { data: docs, error } = await supabase
      .from("knowledge_documents")
      .select("id, title, content, category")
      .is("embedding", null);

    if (error) throw error;
    if (!docs || docs.length === 0) {
      return new Response(JSON.stringify({ message: "All documents already embedded", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let embedded = 0;
    for (const doc of docs) {
      const text = `${doc.category}: ${doc.title}\n${doc.content}`;

      const resp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
      });

      if (!resp.ok) {
        console.error(`Failed to embed doc ${doc.id}: ${resp.status}`);
        continue;
      }

      const json = await resp.json();
      const embedding = json.data?.[0]?.embedding;
      if (!embedding) continue;

      const { error: updateErr } = await supabase
        .from("knowledge_documents")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", doc.id);

      if (!updateErr) embedded++;
    }

    return new Response(
      JSON.stringify({ message: `Embedded ${embedded}/${docs.length} documents`, count: embedded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
