import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, Send, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

const isAvailableNow = (from: string, until: string) => {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const current = hours * 60 + minutes;
  const [fH, fM] = from.split(":").map(Number);
  const [uH, uM] = until.split(":").map(Number);
  return current >= fH * 60 + fM && current <= uH * 60 + uM;
};

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{
    name: string;
    avatar: string | null;
    available_from: string;
    available_until: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Get room info
      const { data: room } = await (supabase as any)
        .from("chat_rooms")
        .select("patient_id, doctor_id")
        .eq("id", roomId)
        .single();

      if (!room) {
        toast.error("Chat room not found");
        setLoading(false);
        return;
      }

      const otherId = room.patient_id === user.id ? room.doctor_id : room.patient_id;

      // Get other user's info
      const [{ data: profile }, { data: doctorProfile }] = await Promise.all([
        (supabase as any).from("profiles").select("display_name, avatar_url").eq("id", otherId).single(),
        (supabase as any).from("doctor_profiles").select("available_from, available_until, avatar_url").eq("id", otherId).maybeSingle(),
      ]);

      setOtherUser({
        name: profile?.display_name ?? "User",
        avatar: doctorProfile?.avatar_url ?? profile?.avatar_url ?? null,
        available_from: doctorProfile?.available_from ?? "09:00",
        available_until: doctorProfile?.available_until ?? "18:00",
      });

      // Load existing messages
      const { data: msgs } = await (supabase as any)
        .from("chat_messages")
        .select("id, sender_id, content, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      setMessages(msgs ?? []);
      setLoading(false);
    };

    void load();
  }, [roomId]);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !roomId || !userId) return;
    setSending(true);

    const { error } = await (supabase as any).from("chat_messages").insert({
      room_id: roomId,
      sender_id: userId,
      content: newMsg.trim(),
    });

    if (error) {
      toast.error("Could not send message", { description: error.message });
    } else {
      setNewMsg("");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const available = otherUser
    ? isAvailableNow(otherUser.available_from, otherUser.available_until)
    : false;

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link to="/my-doctor">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Avatar className="h-10 w-10 rounded-xl">
          <AvatarImage src={otherUser?.avatar ?? undefined} />
          <AvatarFallback className="rounded-xl bg-accent">
            {(otherUser?.name ?? "D").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold truncate">
            Dr. {otherUser?.name}
          </p>
          <Badge
            variant={available ? "default" : "outline"}
            className="gap-1 rounded-full text-xs"
          >
            <Clock className="h-3 w-3" />
            {available
              ? "Available now"
              : `Available ${otherUser?.available_from}–${otherUser?.available_until} IST`}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">
              No messages yet. Say hello! 👋
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border/60 pt-4">
        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={available ? "Type a message..." : "Doctor is offline, but you can still leave a message..."}
          className="flex-1"
        />
        <Button
          onClick={() => void handleSend()}
          disabled={sending || !newMsg.trim()}
          size="icon"
          className="shrink-0 rounded-full"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatRoom;
