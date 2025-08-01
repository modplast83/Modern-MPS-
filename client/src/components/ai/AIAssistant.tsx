import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Mic, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@/types";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', { message });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-6 z-40">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg"
      >
        <Bot className="h-5 w-5" />
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 left-0 w-80 max-h-96 flex flex-col shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="bg-primary text-primary-foreground p-2 rounded-full">
                <Bot className="h-3 w-3" />
              </div>
              <div>
                <h4 className="text-sm font-medium">المساعد الذكي</h4>
                <p className="text-xs text-muted-foreground">متصل</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 max-h-64">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 space-x-reverse ${
                  msg.sender === 'user' ? 'justify-end' : ''
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="bg-primary text-primary-foreground p-1 rounded-full flex-shrink-0">
                    <Bot className="h-3 w-3" />
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 max-w-xs text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className="bg-primary text-primary-foreground p-1 rounded-full flex-shrink-0">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-muted rounded-lg p-3 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <div className="p-4 border-t">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك هنا..."
                className="text-right"
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || chatMutation.isPending}
                size="sm"
                className="btn-primary"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
