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
import { useAuth } from "@/hooks/use-auth";

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
  const [activeSupport, setActiveSupport] = useState<"whatsapp" | "chat">("chat");
  const [authError, setAuthError] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [chatCreationAttempted, setChatCreationAttempted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Fetch WhatsApp support number from public endpoint
  const { data: whatsappData, isLoading: whatsappLoading, error: whatsappError } = useQuery({
    queryKey: ["/api/public/whatsapp-support"],
    queryFn: async () => {
      try {
        console.log("Fetching WhatsApp number...");
        const response = await apiRequest("GET", "/api/public/whatsapp-support");
        console.log("WhatsApp API Response:", response);
        return response;
      } catch (error) {
        console.error("WhatsApp API Error:", error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Update whatsappNumber state when data loads
  useEffect(() => {
    console.log("WhatsApp query state:", { whatsappData, whatsappLoading, whatsappError });
    if (whatsappData?.whatsappNumber) {
      setWhatsappNumber(whatsappData.whatsappNumber);
      console.log("WhatsApp number set to:", whatsappData.whatsappNumber);
    } else if (whatsappError) {
      console.error("WhatsApp error:", whatsappError);
    }
  }, [whatsappData, whatsappError]);

  // Get or create chat session
  const { data: chats, error: chatsError, isLoading: chatsLoading } = useQuery<SupportChat[]>({
    queryKey: ["/api/support/chats"],
    queryFn: async () => {
      console.log("Fetching chats...");
      try {
        const result = await apiRequest("GET", "/api/support/chats");
        console.log("Chats fetched:", result);
        return result;
      } catch (error) {
        console.error("Error fetching chats:", error);
        throw error;
      }
    },
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  // Create chat (used when starting first message)
  const createChatMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("Please log in to start a support chat.");
      }
      return await apiRequest("POST", "/api/support/chat/create", {});
    },
    onSuccess: (data) => {
      setChatId(data.chatId);
      queryClient.invalidateQueries({ queryKey: ["/api/support/chats"] });
    },
    onError: (error) => {
      console.error('Failed to create chat:', error);
      toast({
        title: "Failed to create chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get chat messages
  const { data: chatData, isLoading, error: chatError } = useQuery<ChatDetails>({
    queryKey: ["/api/support/chat", chatId],
    queryFn: async () => {
      return await apiRequest("GET", `/api/support/chat/${chatId}`);
    },
    enabled: !!chatId && isAuthenticated && !authLoading,
    refetchInterval: 5000, // Poll every 5 seconds
    retry: false,
  });

  // Set chatId from existing chats or auto-create (only once)
  useEffect(() => {
    if (!isAuthenticated || authLoading || chatsLoading) {
      return;
    }

    if (typeof chats === 'undefined') {
      return; // query not ready yet
    }

    console.log("Chat initialization logic - chats:", chats, "chatId:", chatId, "attempted:", chatCreationAttempted, "pending:", createChatMutation.isPending);

    if (!chatId && Array.isArray(chats)) {
      const openChat = chats.find(c => c.status === "open");
      if (openChat) {
        console.log("Found existing open chat:", openChat.id);
        setChatId(openChat.id);
      } else if (chats.length === 0 && !chatCreationAttempted && !createChatMutation.isPending) {
        // Auto-create a chat only if none exists, we haven't tried yet, and no mutation is pending
        console.log("No existing chats, auto-creating...");
        setChatCreationAttempted(true);
        createChatMutation.mutate();
      }
    }
  }, [chats, chatId, isAuthenticated, authLoading, chatsLoading, chatCreationAttempted]);

  // Surface auth errors clearly so users know to re-login
  useEffect(() => {
    const unauthorized = (err?: unknown) => {
      const msg = err instanceof Error ? err.message : String(err || "");
      return msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("401");
    };

    if (chatsError && unauthorized(chatsError)) {
      setAuthError("Your session expired. Please log in again to use support chat.");
    } else if (chatError && unauthorized(chatError)) {
      setAuthError("Your session expired. Please log in again to use support chat.");
    } else {
      setAuthError(null);
    }
  }, [chatsError, chatError]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to send messages.");
      }

      let id = chatId;
      if (!id) {
        const created = await apiRequest<{ success: boolean; chatId: string }>("POST", "/api/support/chat/create", {});
        id = created.chatId;
        setChatId(id);
        queryClient.invalidateQueries({ queryKey: ["/api/support/chats"] });
      }

      return await apiRequest("POST", `/api/support/chat/${id}/message`, { message });
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
    if (!message.trim() || !chatId || !isAuthenticated) return;
    sendMessageMutation.mutate(message);
  };

  const handleWhatsAppSupport = () => {
    setActiveSupport("whatsapp");
    
    console.log("WhatsApp number state:", whatsappNumber);
    console.log("WhatsApp data:", whatsappData);

    if (!whatsappNumber) {
      console.warn("WhatsApp number not found");
      toast({
        title: "WhatsApp Support Unavailable",
        description: "Admin has not configured WhatsApp support yet.",
        variant: "destructive",
      });
      return;
    }

    // Remove any formatting characters (keep only digits)
    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    
    console.log("Cleaned WhatsApp number:", cleanNumber);
    
    if (!cleanNumber) {
      toast({
        title: "Invalid WhatsApp Number",
        description: "The WhatsApp number is not properly configured.",
        variant: "destructive",
      });
      return;
    }
    
    const messageText = encodeURIComponent("Hi, I need help with my data bundle purchase.");
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${messageText}`;
    console.log("WhatsApp URL:", whatsappUrl);
    window.open(whatsappUrl, "_blank");
  };

  const handleLiveChatSupport = () => {
    setActiveSupport("chat");
    document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
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
          await apiRequest("PUT", `/api/support/message/${msg.id}/read`, {}) as Response;
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

  if (!isAuthenticated && !authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Support</CardTitle>
          <CardDescription>You need to log in to start a support chat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = "/login"} className="w-full">Go to Login</Button>
        </CardContent>
      </Card>
    );
  }

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
            className={`h-auto py-4 text-sm flex-col gap-2 ${
              activeSupport === "whatsapp"
                ? "bg-yellow-500 text-white font-medium shadow-sm"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <MessageCircle className="h-6 w-6" />
            <span>WhatsApp Support</span>
            <span className="text-xs opacity-90">Get instant help via WhatsApp</span>
          </Button>
          <Button
            onClick={handleLiveChatSupport}
            className={`h-auto py-4 text-sm flex-col gap-2 ${
              activeSupport === "chat"
                ? "bg-yellow-500 text-white font-medium shadow-sm"
                : "border hover:bg-accent"
            }`}
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
            {chatId ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Connected
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {createChatMutation.isPending ? "Connecting..." : "Initializing..."}
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Send us a message and we'll respond as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

        {authError && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {authError}
          </div>
        )}

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
                disabled={sendMessageMutation.isPending || !message.trim()}
                title={
                  !message.trim() ? "Message cannot be empty" :
                  sendMessageMutation.isPending ? "Sending message..." :
                  "Send message"
                }
              >
                <Send className="h-4 w-4" />
                {sendMessageMutation.isPending && "Sending..."}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
