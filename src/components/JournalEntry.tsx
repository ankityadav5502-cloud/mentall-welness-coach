import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookHeart, Sparkles } from "lucide-react";
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

  useEffect(() => {
    const loadTodayEntry = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("journal_entries")
        .select("free_text,prompt_win,prompt_feeling,prompt_intention")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (!data) return;
      setFreeText(data.free_text ?? "");
      setAnswers({
        win: data.prompt_win ?? "",
        feeling: data.prompt_feeling ?? "",
        intention: data.prompt_intention ?? "",
      });
      setShowPrompts(Boolean(data.prompt_win || data.prompt_feeling || data.prompt_intention));
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

    const { error } = await (supabase as any).from("journal_entries").upsert(payload, { onConflict: "user_id,date" });
    setLoading(false);
    if (error) {
      toast.error("Could not save journal", { description: error.message });
      return;
    }
    toast.success("Journal saved 🌱", { description: "Your reflection is safe with you." });
  };

  const hasContent =
    freeText.trim().length > 0 ||
    Object.values(answers).some((v) => v.trim().length > 0);

  return (
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
            onChange={(e) => setFreeText(e.target.value)}
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
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [p.key]: e.target.value }))
                    }
                    placeholder={p.placeholder}
                    className="min-h-[60px] resize-none bg-background/80"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={!hasContent || loading} className="rounded-full">
            Save reflection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JournalEntry;