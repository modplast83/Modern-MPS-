import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "../../lib/queryClient";
import ErrorBoundary from "../ErrorBoundary";
import {
  Bot,
  User,
  Send,
  Mic,
  Volume2,
  Bell,
  TrendingUp,
  Settings,
} from "lucide-react";
import { generateMessageId } from "../../../../shared/id-generator";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: t('ai.developedAssistant'),
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // إجراءات سريعة للمساعد الذكي
  const quickActions = [
    {
      label: t('aiAssistant.registerClient'),
      icon: User,
      command: t('aiAssistant.registerClientCommand'),
      description: t('aiAssistant.addClient'),
    },
    {
      label: t('aiAssistant.addProduct'),
      icon: TrendingUp,
      command: t('aiAssistant.addProductCommand'),
      description: t('aiAssistant.addClientProduct'),
    },
    {
      label: t('aiAssistant.productionStatus'),
      icon: Settings,
      command: t('aiAssistant.productionStatusCommand'),
      description: t('aiAssistant.productionStats'),
    },
    {
      label: t('aiAssistant.help'),
      icon: Bell,
      command: t('aiAssistant.helpCommand'),
      description: t('aiAssistant.userGuide'),
    },
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id) {
        throw new Error(t('ai.loginRequired'));
      }
      
      setIsTyping(true);
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          context: "factory_operations",
          userId: user.id,
        }),
      });
      return response.json();
    },
    onSuccess: (response: any) => {
      setIsTyping(false);
      
      // Extract the message from different possible response fields
      const content = 
        response.reply || 
        response.message || 
        response.clarificationQuestion || 
        response.confirmationMessage || 
        t('aiAssistant.processingError');
      
      const assistantMessage: Message = {
        id: generateMessageId(),
        type: "assistant",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: () => {
      setIsTyping(false);
      const errorMessage: Message = {
        id: generateMessageId(),
        type: "assistant",
        content: t('aiAssistant.connectionError'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: t('aiAssistant.assistantError'),
        description: t('aiAssistant.serviceUnavailable'),
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend) return;

    const userMessage: Message = {
      id: generateMessageId(),
      type: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessageMutation.mutate(messageToSend);
    setInputValue("");
  };

  const handleQuickAction = (command: string) => {
    handleSendMessage(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    toast({
      title: t('aiAssistant.voiceInput'),
      description: t('aiAssistant.useVoiceAssistant'),
    });
  };

  const speakMessage = (content: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = "ar-SA";
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          {t('ai.assistant')}
          <Badge variant="secondary" className="mr-auto">
            {t('common.active')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user" ? "bg-blue-100" : "bg-green-100"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    {message.type === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-6 p-1 text-gray-500 hover:text-gray-700"
                        onClick={() => speakMessage(message.content)}
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      ></div>
                      <span className="text-xs text-gray-500 mr-2">{t('aiAssistant.thinking')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('aiAssistant.messagePlaceholder')}
              className="flex-1"
              disabled={sendMessageMutation.isPending}
              data-testid="input-ai-message"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceInput}
              data-testid="button-ai-voice"
              title={t('aiAssistant.voiceInput')}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || sendMessageMutation.isPending}
              data-testid="button-ai-send"
              title={t('ai.send')}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
