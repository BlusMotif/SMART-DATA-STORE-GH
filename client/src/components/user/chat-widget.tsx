import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { SupportChat, ChatMessage } from "@shared/schema";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's chats
  const { data: chats } = useQuery<SupportChat[]>({
    queryKey: ["/api", "support", "chats"],
    enabled: isOpen && !!user,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Get current chat messages
  const { data: chatData } = useQuery<{ chat: SupportChat; messages: ChatMessage[] }>({
    queryKey: ["/api", "support", "chat", currentChatId],
    enabled: !!currentChatId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Create new chat
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/support/chat/create", {});
      return await response.json();
    },
    onSuccess: (data: { chatId: string }) => {
      setCurrentChatId(data.chatId);
      queryClient.invalidateQueries({ queryKey: ["/api", "support", "chats"] });
      toast({
        title: "✅ Chat Started",
        description: "You can now send messages. An admin will respond shortly.",
        duration: 4000,
      });
      
      // Send pending message if exists
      if (pendingMessage) {
        apiRequest("POST", `/api/support/chat/${data.chatId}/message`, { message: pendingMessage })
          .then(() => {
            setPendingMessage(null);
            queryClient.invalidateQueries({ queryKey: ["/api", "support", "chat", data.chatId] });
            queryClient.invalidateQueries({ queryKey: ["/api", "support", "chats"] });
          })
          .catch(() => {
            toast({
              title: "❌ Error",
              description: "Failed to send message. Please try again.",
              variant: "destructive",
            });
            setPendingMessage(null);
          });
      }
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, msg }: { chatId: string; msg: string }) => 
      apiRequest("POST", `/api/support/chat/${chatId}/message`, { message: msg }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api", "support", "chat", currentChatId] });
      queryClient.invalidateQueries({ queryKey: ["/api", "support", "chats"] });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatData?.messages]);

  // Load or create chat when opening widget
  useEffect(() => {
    if (isOpen && !currentChatId && chats) {
      const openChat = chats.find(c => c.status === 'open');
      if (openChat) {
        setCurrentChatId(openChat.id);
      }
    }
  }, [isOpen, chats, currentChatId]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (!currentChatId) {
      // Store message and create chat first
      setPendingMessage(message);
      setMessage("");
      createChatMutation.mutate();
    } else {
      sendMessageMutation.mutate({ chatId: currentChatId, msg: message });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-2xl z-[9999] hover:scale-105 transition-all duration-200"
          size="icon"
          aria-label="Open support chat"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[80vh] sm:h-[550px] flex flex-col shadow-2xl z-[9999] border-2">
          <CardHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <CardTitle className="text-lg">Support Chat</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {chatData?.chat.status === 'closed' && (
              <Badge variant="secondary" className="mt-2">Chat Closed</Badge>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              {!chatData?.messages.length ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatData.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.senderType === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.senderType === 'admin' && (
                          <p className="text-xs font-semibold mb-1 opacity-80">Support Team</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-3">
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendMessageMutation.isPending || chatData?.chat.status === 'closed'}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending || chatData?.chat.status === 'closed'}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
