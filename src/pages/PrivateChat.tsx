import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface Friend {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

const PrivateChat = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friend, setFriend] = useState<Friend | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !friendId) {
      navigate("/auth");
      return;
    }
    fetchFriend();
    loadMessages();
    markMessagesAsRead();

    const channel = supabase
      .channel(`private_chat_${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `sender_id=eq.${friendId}`,
        },
        (payload) => {
          if (
            (payload.new as Message).receiver_id === user.id ||
            (payload.new as Message).sender_id === user.id
          ) {
            loadMessages();
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fetchFriend = async () => {
    if (!friendId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", friendId)
      .single();

    if (error) {
      console.error("Error fetching friend:", error);
      toast.error("Ошибка загрузки профиля друга");
      return;
    }

    setFriend(data);
  };

  const loadMessages = async () => {
    if (!user || !friendId) return;

    const { data, error } = await supabase
      .from("private_messages")
      .select(`
        *,
        sender:profiles!private_messages_sender_id_fkey(display_name, avatar_url)
      `)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const markMessagesAsRead = async () => {
    if (!user || !friendId) return;

    await supabase
      .from("private_messages")
      .update({ read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", friendId)
      .eq("read", false);
  };

  const messageSchema = z.object({
    message: z.string()
      .trim()
      .min(1, "Сообщение не может быть пустым")
      .max(2000, "Сообщение не должно превышать 2000 символов")
  });

  const sendMessage = async () => {
    if (!user || !friendId) return;

    // Validate input
    const validation = messageSchema.safeParse({ message: newMessage });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from("private_messages").insert({
        sender_id: user.id,
        receiver_id: friendId,
        message: validation.data.message,
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Ошибка отправки сообщения");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!friend) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/friends")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src={friend.avatar_url || undefined} />
            <AvatarFallback>
              {friend.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{friend.display_name}</h2>
            <p className="text-xs text-muted-foreground">Личный чат</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`p-3 max-w-[70%] ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm break-words">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString("ru", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;
