import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Phone, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  message: string;
  sender: "user" | "support";
  timestamp: string;
}

export function SupportChat() {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/support/messages"],
    enabled: isOpen,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest("POST", "/api/support/messages", { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages"] });
      setMessage("");
    },
    onError: (error: Error) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = "+233501234567"; // Replace with actual support number
    const message = encodeURIComponent("Hi, I need help with my data bundle purchase.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const handleCallSupport = () => {
    const phoneNumber = "+233501234567"; // Replace with actual support number
    window.open(`tel:${phoneNumber}`, "_self");
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Customer Support
        </CardTitle>
        <CardDescription>
          Get help with your data bundle purchases and account issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {isOpen ? "Close Chat" : "Start Chat"}
          </Button>
          <Button
            variant="outline"
            onClick={handleWhatsAppSupport}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={handleCallSupport}
            className="flex-1"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
        </div>

        {isOpen && (
          <div className="border rounded-lg h-96 flex flex-col">
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
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender === "support" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>SP</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          msg.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {msg.sender === "user" && (
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
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}