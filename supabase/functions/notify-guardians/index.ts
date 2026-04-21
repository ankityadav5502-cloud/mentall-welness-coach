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

    const { userId, sosEventId } = await req.json();
    if (!userId) throw new Error("userId is required");

    const { data: links, error: linksError } = await supabase
      .from("guardian_links")
      .select("guardian_id, relationship")
      .eq("dependent_id", userId);

    if (linksError) throw linksError;

    // Notification provider intentionally skipped for now.
    // This function still resolves linked guardians so the app can continue
    // end-to-end without external SMS/email integration.
    return new Response(
      JSON.stringify({
        ok: true,
        delivered: 0,
        message: "Notification provider not configured. Guardian lookup completed.",
        userId,
        sosEventId,
        guardians: links ?? [],
      }),
      {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
