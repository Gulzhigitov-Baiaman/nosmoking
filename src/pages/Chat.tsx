import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { toast } from "sonner";
import { PremiumGuard } from "@/components/PremiumGuard";
import { z } from "zod";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    quit_date: string | null;
  };
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "💪", "😂", "🎉", "👏", "✨"];

export default function Chat() {
  return (
    <PremiumGuard>
      <ChatContent />
    </PremiumGuard>
  );
}

function ChatContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Record<string, MessageReaction[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    loadMessages();
    loadReactions();

    const messagesChannel = supabase
      .channel("chat-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        loadMessages();
      })
      .subscribe();

    const reactionsChannel = supabase
      .channel("chat-reactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, () => {
        loadReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [user]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`*, profiles:user_id (username, display_name, quit_date)`)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const loadReactions = async () => {
    const { data, error } = await supabase
      .from("chat_reactions")
      .select("*");

    if (error) {
      console.error("Error loading reactions:", error);
    } else {
      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) acc[reaction.message_id] = [];
        acc[reaction.message_id].push(reaction);
        return acc;
      }, {} as Record<string, MessageReaction[]>);
      setReactions(grouped);
    }
  };

  const messageSchema = z.object({
    message: z.string()
      .trim()
      .min(1, "Сообщение не может быть пустым")
      .max(1000, "Сообщение не должно превышать 1000 символов")
  });

  const sendMessage = async () => {
    if (!user) return;

    // Validate input
    const validation = messageSchema.safeParse({ message: newMessage });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      message: validation.data.message,
    });

    if (error) {
      toast.error("Не удалось отправить сообщение");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    // Check if user already reacted with this emoji
    const existingReaction = reactions[messageId]?.find(
      (r) => r.user_id === user.id && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      await supabase.from("chat_reactions").delete().eq("id", existingReaction.id);
      toast.success("Реакция удалена");
    } else {
      // Remove other reactions from this user on this message
      const userReactions = reactions[messageId]?.filter((r) => r.user_id === user.id);
      if (userReactions && userReactions.length > 0) {
        await supabase
          .from("chat_reactions")
          .delete()
          .in("id", userReactions.map((r) => r.id));
      }

      // Add new reaction
      const { error } = await supabase.from("chat_reactions").insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });

      if (error) {
        toast.error("Ошибка добавления реакции");
      }
    }
  };

  const getDaysWithoutSmoking = (quitDate: string | null) => {
    if (!quitDate) return 0;
    const diff = Date.now() - new Date(quitDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getReactionCounts = (messageId: string) => {
    const msgReactions = reactions[messageId] || [];
    return msgReactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">💬 Общий чат</h1>
        </div>

        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => {
                const reactionCounts = getReactionCounts(msg.id);
                const userReaction = reactions[msg.id]?.find((r) => r.user_id === user?.id);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.user_id === user?.id ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {msg.profiles.display_name || msg.profiles.username}
                      </span>
                      <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {getDaysWithoutSmoking(msg.profiles.quit_date)} дней
                      </span>
                    </div>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.user_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Smile className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex gap-1">
                            {QUICK_EMOJIS.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-lg"
                                onClick={() => addReaction(msg.id, emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                          <Button
                            key={emoji}
                            variant="outline"
                            size="sm"
                            className={`h-6 px-2 text-xs ${
                              userReaction?.emoji === emoji ? "bg-primary/20" : ""
                            }`}
                            onClick={() => addReaction(msg.id, emoji)}
                          >
                            {emoji} {count}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
