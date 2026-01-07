import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  senderType: "user" | "admin";
  isRead: boolean;
  createdAt: string;
}

interface SupportChat {
  id: string;
  userId: string;
  status: "open" | "closed";
  createdAt: string;
}

interface ChatDetails {
  chat: SupportChat;
  messages: ChatMessage[];
}

export function SupportChat() {
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get or create chat session
  const { data: chats } = useQuery<SupportChat[]>({
    queryKey: ["/api/support/chats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/support/chats");
      return response.json();
    },
  });

  // Create chat if none exists
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/support/chat/create", {});
      return response.json();
    },
    onSuccess: (data) => {
      setChatId(data.chatId);
      queryClient.invalidateQueries({ queryKey: ["/api/support/chats"] });
    },
  });

  // Get chat messages
  const { data: chatData, isLoading } = useQuery<ChatDetails>({
    queryKey: ["/api/support/chat", chatId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/support/chat/${chatId}`);
      return response.json();
    },
    enabled: !!chatId,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Set chatId from existing chats or create new one
  useEffect(() => {
    if (chats && chats.length > 0 && !chatId) {
      // Use the most recent open chat
      const openChat = chats.find(c => c.status === "open");
      if (openChat) {
        setChatId(openChat.id);
      } else {
        // Create new chat if no open chats
        createChatMutation.mutate();
      }
    } else if (chats && chats.length === 0 && !chatId) {
      // No chats exist, create one
      createChatMutation.mutate();
    }
  }, [chats, chatId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/support/chat/${chatId}/message`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/chat", chatId] });
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatId) return;
    sendMessageMutation.mutate(message);
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = "+233501234567"; // Replace with actual support number
    const messageText = encodeURIComponent("Hi, I need help with my data bundle purchase.");
    window.open(`https://wa.me/${phoneNumber}?text=${messageText}`, "_blank");
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatData?.messages]);

  // Mark admin messages as read when user views them
  useEffect(() => {
    if (chatData?.messages && chatId) {
      const unreadAdminMessages = chatData.messages.filter(
        msg => msg.senderType === 'admin' && !msg.isRead
      );
      
      // Mark each unread admin message as read
      unreadAdminMessages.forEach(async (msg) => {
        try {
          await apiRequest("PUT", `/api/support/message/${msg.id}/read`, {});
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      });
      
      // Invalidate unread count query to update badge
      if (unreadAdminMessages.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/support/unread-count"] });
      }
    }
  }, [chatData?.messages, chatId, queryClient]);

  const messages = chatData?.messages || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customer Support</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your preferred support channel
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={handleWhatsAppSupport}
            className="h-auto py-4 text-sm bg-green-600 hover:bg-green-700 text-white flex-col gap-2"
          >
            <MessageCircle className="h-6 w-6" />
            <span>WhatsApp Support</span>
            <span className="text-xs opacity-90">Get instant help via WhatsApp</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 text-sm flex-col gap-2"
            onClick={() => document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <MessageCircle className="h-6 w-6" />
            <span>Live Chat</span>
            <span className="text-xs text-muted-foreground">Chat with our support team</span>
          </Button>
        </div>
      </div>

      <Card id="chat-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
            Live Chat
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Send us a message and we'll respond as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

        <div className="border rounded-lg h-[600px] flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No messages yet. Start a conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg: ChatMessage) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.senderType === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.senderType === "admin" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">ST</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        msg.senderType === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {msg.senderType === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>ME</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={sendMessageMutation.isPending || !message.trim() || !chatId}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
