import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Plus,
  MessageSquare,
  Loader2,
  Brain,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: { title: string; category: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

const SUGGESTED_PROMPTS = [
  "How am I doing this week?",
  "What patterns do you see in my journal?",
  "I'm feeling anxious, can you help?",
  "What is CBT and how can it help me?",
  "Suggest a breathing exercise",
  "Summarize my mood trends",
];

const AiChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      const { data } = await (supabase as any)
        .from("ai_chat_sessions")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      setSessions(data || []);
      setSessionsLoading(false);
    };
    void loadSessions();
  }, []);

  // Load messages for active session
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      const { data } = await (supabase as any)
        .from("ai_chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", activeSession)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    void loadMessages();
  }, [activeSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setShowSidebar(false);

    // Optimistic UI: add user message immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: msg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    let streamBuffer = ""; // buffer for incomplete chunks

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId: activeSession, message: msg }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || "Failed to get response");
      }

      setLoading(false); // remove the thinking spinner since stream is starting

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No readable stream");

      let isFirstMetadata = true;
      let currentReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamBuffer += chunk;
        const lines = streamBuffer.split("\n");
        // Keep the last incomplete line in the buffer
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'metadata') {
                if (isFirstMetadata) {
                  if (!activeSession) {
                    setActiveSession(data.sessionId);
                    setSessions((prev) => [
                      {
                        id: data.sessionId,
                        title: data.title || "New conversation",
                        updated_at: new Date().toISOString(),
                      },
                      ...prev,
                    ]);
                  } else {
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === activeSession
                          ? { ...s, updated_at: new Date().toISOString() }
                          : s
                      )
                    );
                  }
                  
                  // Create empty assistant message container
                  const assistantMsg: ChatMessage = {
                    id: `resp-${Date.now()}`,
                    role: "assistant",
                    content: "",
                    created_at: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, assistantMsg]);
                  isFirstMetadata = false;
                }
              } else if (data.type === 'sources') {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg && lastMsg.role === "assistant") {
                    lastMsg.sources = data.sources;
                  }
                  return newMsgs;
                });
              } else if (data.type === 'text') {
                currentReply += data.text;
                // Update the last message
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg && lastMsg.role === "assistant") {
                    lastMsg.content = currentReply;
                  }
                  return newMsgs;
                });
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    } catch (err: any) {
      toast.error("Failed to get response", {
        description: err.message || "Please try again",
      });
      // Remove optimistic message on error if it's just the user's msg
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const startNewChat = () => {
    setActiveSession(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString("en-IN", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const isWelcomeScreen = messages.length === 0 && !activeSession;

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
      {/* ── Sidebar ─────────────────────────────── */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } absolute z-20 h-full w-72 border-r border-border/60 bg-muted/30 transition-transform md:relative md:block`}
      >
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h2 className="font-display text-sm font-semibold">Conversations</h2>
          <Button size="sm" variant="ghost" onClick={startNewChat} className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-57px)]">
          <div className="space-y-1 p-2">
            {sessionsLoading ? (
              <p className="p-4 text-center text-xs text-muted-foreground">Loading…</p>
            ) : sessions.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No conversations yet</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSession(s.id);
                    setShowSidebar(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    activeSession === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{s.title}</p>
                    <p className="text-[10px] opacity-60">{formatTime(s.updated_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Main chat area ──────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 md:hidden"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white text-sm font-bold">
              🧠
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Sage</p>
              <p className="text-[10px] text-muted-foreground">AI Wellness Companion</p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          {isWelcomeScreen ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-12">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-600/20">
                <Brain className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <h2 className="font-display text-2xl font-semibold">Hey there 🌿</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  I'm Sage, your AI wellness companion. I can answer your mental health
                  questions, reflect on your journal patterns, and help you understand
                  your wellness journey. Ask me anything!
                </p>
              </div>
              <div className="grid max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                  >
                    <Sparkles className="mb-1 inline h-3.5 w-3.5 text-primary/60" />{" "}
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Sage is an AI companion, not a medical professional. For emergencies,
                  call Tele MANAS: <strong>14416</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs text-white">
                      🧠
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/60 text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}
                    <p className="mt-1.5 text-[10px] opacity-50">
                      {formatTime(msg.created_at)}
                    </p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/30 pt-3">
                        {msg.sources.map((s, idx) => (
                          <Badge key={idx} variant="outline" className="bg-background/50 text-[9px] text-muted-foreground hover:bg-background/80">
                            📚 {s.title} ({s.category})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs text-white">
                    🧠
                  </span>
                  <div className="rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sage is thinking…
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input bar */}
        <div className="border-t border-border/60 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sage anything about mental wellness…"
              disabled={loading}
              className="flex-1 rounded-full bg-muted/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              className="h-10 w-10 shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
