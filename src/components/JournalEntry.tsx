import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookHeart, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const prompts = [
  { key: "win", label: "One small win today", placeholder: "Even tiny ones count…" },
  { key: "feeling", label: "One feeling I noticed", placeholder: "Name it gently…" },
  { key: "intention", label: "One tiny intention for tomorrow", placeholder: "Soft and doable…" },
] as const;

type PromptKey = typeof prompts[number]["key"];

export const JournalEntry = () => {
  const [freeText, setFreeText] = useState("");
  const [answers, setAnswers] = useState<Record<PromptKey, string>>({
    win: "",
    feeling: "",
    intention: "",
  });
  const [showPrompts, setShowPrompts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Reflection state
  const [reflection, setReflection] = useState<string | null>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [reflectionLoading, setReflectionLoading] = useState(false);

  useEffect(() => {
    const loadTodayEntry = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("journal_entries")
        .select("id, free_text, prompt_win, prompt_feeling, prompt_intention")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (!data) return;
      setEntryId(data.id);
      setFreeText(data.free_text ?? "");
      setAnswers({
        win: data.prompt_win ?? "",
        feeling: data.prompt_feeling ?? "",
        intention: data.prompt_intention ?? "",
      });
      setShowPrompts(Boolean(data.prompt_win || data.prompt_feeling || data.prompt_intention));
      setSaved(true);

      // Load cached reflection if exists
      const { data: cachedReflection } = await (supabase as any)
        .from("journal_reflections")
        .select("reflection, themes")
        .eq("journal_entry_id", data.id)
        .maybeSingle();
      if (cachedReflection) {
        setReflection(cachedReflection.reflection);
        setThemes(cachedReflection.themes || []);
      }
    };
    void loadTodayEntry();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      user_id: user.id,
      date: today,
      free_text: freeText,
      prompt_win: answers.win,
      prompt_feeling: answers.feeling,
      prompt_intention: answers.intention,
    };

    const { data, error } = await (supabase as any)
      .from("journal_entries")
      .upsert(payload, { onConflict: "user_id,date" })
      .select("id")
      .single();

    setLoading(false);
    if (error) {
      toast.error("Could not save journal", { description: error.message });
      return;
    }

    const savedId = data?.id;
    if (savedId) setEntryId(savedId);
    setSaved(true);
    toast.success("Journal saved 🌱", { description: "Your reflection is safe with you." });

    // Fire-and-forget: generate embedding for RAG
    if (savedId) {
      supabase.functions.invoke("embed-content", {
        body: { sourceType: "journal", sourceId: savedId },
      }).catch(() => {
        /* embedding is best-effort, don't block the user */
      });
    }
  };

  const handleReflect = async () => {
    if (!entryId) return;
    setReflectionLoading(true);
    try {
      const resp = await supabase.functions.invoke("journal-reflect", {
        body: { entryId },
      });
      if (resp.error) throw resp.error;
      const data = resp.data as { reflection: string; themes: string[] };
      setReflection(data.reflection);
      setThemes(data.themes || []);
    } catch (err: any) {
      toast.error("Couldn't generate reflection", {
        description: err.message || "Please try again",
      });
    } finally {
      setReflectionLoading(false);
    }
  };

  const hasContent =
    freeText.trim().length > 0 ||
    Object.values(answers).some((v) => v.trim().length > 0);

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
              <BookHeart className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="font-display text-2xl">Today's journal</CardTitle>
              <CardDescription>
                No rules. Just a soft place to land your thoughts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="journal-free" className="text-sm font-medium">
              Free write
            </Label>
            <Textarea
              id="journal-free"
              value={freeText}
              onChange={(e) => { setFreeText(e.target.value); setSaved(false); }}
              placeholder="What's on your mind today?"
              className="min-h-[140px] resize-none bg-background/60"
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
            <button
              type="button"
              onClick={() => setShowPrompts((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-secondary" />
                Guided prompts (optional)
              </span>
              <span className="text-xs text-muted-foreground">
                {showPrompts ? "Hide" : "Show"}
              </span>
            </button>

            {showPrompts && (
              <div className="mt-4 space-y-3">
                {prompts.map((p) => (
                  <div key={p.key} className="space-y-1">
                    <Label htmlFor={`p-${p.key}`} className="text-xs text-muted-foreground">
                      {p.label}
                    </Label>
                    <Textarea
                      id={`p-${p.key}`}
                      value={answers[p.key]}
                      onChange={(e) => {
                        setAnswers((prev) => ({ ...prev, [p.key]: e.target.value }));
                        setSaved(false);
                      }}
                      placeholder={p.placeholder}
                      className="min-h-[60px] resize-none bg-background/80"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved && entryId && (
              <Button
                variant="outline"
                onClick={() => void handleReflect()}
                disabled={reflectionLoading}
                className="rounded-full"
              >
                {reflectionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reflecting…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Reflect ✨
                  </>
                )}
              </Button>
            )}
            <Button onClick={() => void handleSave()} disabled={!hasContent || loading} className="rounded-full">
              {loading ? "Saving…" : "Save reflection"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Reflection Card */}
      {(reflection || reflectionLoading) && (
        <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 shadow-card dark:border-emerald-800/40 dark:from-emerald-950/20 dark:to-teal-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm text-white">
                🧠
              </span>
              <CardTitle className="font-display text-lg">Sage's Reflection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {reflectionLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-emerald-200/40" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-emerald-200/40" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-emerald-200/40" />
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-foreground/80">{reflection}</p>
                {themes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {themes.map((theme) => (
                      <Badge
                        key={theme}
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JournalEntry;