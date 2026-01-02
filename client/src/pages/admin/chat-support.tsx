import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageCircle, Send, UserCircle, Clock, CheckCircle, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import type { SupportChat, ChatMessage } from "@shared/schema";

export default function AdminChatSupport() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all chats
  const { data: chats, isLoading } = useQuery<SupportChat[]>({
    queryKey: ["/api", "admin", "support", "chats", `?status=${filter}`],
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Get selected chat details
  const { data: chatData } = useQuery<{ chat: SupportChat; messages: ChatMessage[] }>({
    queryKey: ["/api", "support", "chat", selectedChatId],
    enabled: !!selectedChatId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) =>
      apiRequest("POST", `/api/support/chat/${selectedChatId}/message`, { message: msg }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api", "support", "chat", selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ["/api", "admin", "support", "chats"] });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to send message",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  // Assign chat mutation
  const assignChatMutation = useMutation({
    mutationFn: (chatId: string) =>
      apiRequest("PUT", `/api/admin/support/chat/${chatId}/assign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "admin", "support", "chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "support", "chat", selectedChatId] });
      toast({
        title: "✅ Assigned",
        description: "Chat assigned to you",
        duration: 3000,
      });
    },
  });

  // Close chat mutation
  const closeChatMutation = useMutation({
    mutationFn: (chatId: string) =>
      apiRequest("PUT", `/api/support/chat/${chatId}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "admin", "support", "chats"] });
      setSelectedChatId(null);
      toast({
        title: "✅ Chat Closed",
        description: "The chat has been closed",
        duration: 3000,
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatData?.messages]);

  // Auto-select first chat
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChatId) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUnreadCount = (chat: SupportChat) => {
    // This would ideally come from the backend
    return 0; // Placeholder
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with menu button */}
        <div className="lg:hidden border-b px-4 py-3 flex items-center justify-between bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Support Chat</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-4 md:mb-6 hidden lg:block">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Support Chat</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage customer support conversations</p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-200px)]">
          {/* Chat List */}
          <Card className="lg:col-span-1 max-h-[40vh] lg:max-h-none">
            <CardHeader className="border-b p-3 md:p-6">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as "open" | "closed")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="open" className="text-xs md:text-sm">Open</TabsTrigger>
                  <TabsTrigger value="closed" className="text-xs md:text-sm">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(40vh-100px)] lg:h-[calc(100vh-340px)]">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
                ) : !chats || chats.length === 0 ? (
                  <div className="p-4 md:p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-xs md:text-sm">No {filter} chats</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full p-3 md:p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedChatId === chat.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{chat.userName}</span>
                          </div>
                          {chat.status === 'open' && (
                            <Badge variant="default" className="text-xs">Open</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{chat.userEmail}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(chat.lastMessageAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat View */}
          <Card className="lg:col-span-2 flex flex-col min-h-[55vh] lg:min-h-0">
            {!selectedChatId || !chatData ? (
              <CardContent className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">Select a chat to view conversation</p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="border-b p-3 md:p-6">
                  <div className="flex items-start md:items-center justify-between gap-2 flex-col md:flex-row">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <UserCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="truncate">{chatData.chat.userName}</span>
                      </CardTitle>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
                        {chatData.chat.userEmail}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap w-full md:w-auto">
                      {!chatData.chat.assignedToAdminId && chatData.chat.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => assignChatMutation.mutate(chatData.chat.id)}
                          disabled={assignChatMutation.isPending}
                          className="text-xs flex-1 md:flex-initial"
                        >
                          Assign to Me
                        </Button>
                      )}
                      {chatData.chat.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closeChatMutation.mutate(chatData.chat.id)}
                          disabled={closeChatMutation.isPending}
                          className="text-xs flex-1 md:flex-initial"
                        >
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Close Chat
                        </Button>
                      )}
                      {chatData.chat.status === 'closed' && (
                        <Badge variant="secondary" className="text-xs">Closed</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[calc(55vh-200px)] lg:h-[calc(100vh-480px)] p-3 md:p-4" ref={scrollRef}>
                    {chatData.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p className="text-xs md:text-sm">No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 md:space-y-3">
                        {chatData.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.senderType === 'admin' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2 md:p-3 ${
                                msg.senderType === 'admin'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.senderType === 'user' && (
                                <p className="text-[10px] md:text-xs font-semibold mb-1 opacity-80">Customer</p>
                              )}
                              <p className="text-xs md:text-sm whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                              <p className="text-[10px] md:text-xs opacity-70 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                <div className="border-t p-3 md:p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={
                        sendMessageMutation.isPending || chatData.chat.status === 'closed'
                      }
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        !message.trim() ||
                        sendMessageMutation.isPending ||
                        chatData.chat.status === 'closed'
                      }
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
