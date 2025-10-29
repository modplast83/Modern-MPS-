import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/use-auth";
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: `👋 مرحباً! أنا مساعدك الذكي المطور في نظام MPBF Next

أنا هنا لمساعدتك في إدارة المصنع بذكاء. إليك ما يمكنني فعله:

📊 **تحليل البيانات والإحصائيات**
• معرفة حالة الإنتاج الحالية
• مراجعة أداء المكائن
• تحليل الجودة والهدر
• متابعة الطلبات والرولات

📈 **التقارير الذكية**
• تقارير الإنتاج مع التحليل
• تقارير الجودة والصيانة
• مقارنات الأداء
• توصيات للتحسين

💡 **أمثلة على الأسئلة:**
• "ما حالة الإنتاج اليوم؟"
• "كم عدد العملاء لدينا؟"
• "أعطني تحليل لأداء المكائن"
• "ما هي المكائن التي تحتاج صيانة؟"

جرب الأزرار السريعة أدناه أو اكتب سؤالك مباشرة! 👇`,
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
      label: "حالة الإنتاج",
      icon: TrendingUp,
      command: "ما حالة الإنتاج اليوم؟",
      description: "إحصائيات الإنتاج الحالية",
    },
    {
      label: "عدد العملاء",
      icon: User,
      command: "كم عدد العملاء لدينا؟",
      description: "إحصائيات العملاء",
    },
    {
      label: "حالة المكائن",
      icon: Settings,
      command: "أعطني تحليل لحالة المكائن",
      description: "تقرير حالة جميع المكائن",
    },
    {
      label: "الطلبات النشطة",
      icon: Bell,
      command: "ما عدد الطلبات النشطة؟",
      description: "عرض الطلبات النشطة",
    },
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id) {
        throw new Error("يجب تسجيل الدخول لاستخدام المساعد الذكي");
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
      const assistantMessage: Message = {
        id: generateMessageId(),
        type: "assistant",
        content:
          response.reply || "عذراً، لم أستطع معالجة طلبك في الوقت الحالي.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: () => {
      setIsTyping(false);
      const errorMessage: Message = {
        id: generateMessageId(),
        type: "assistant",
        content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "خطأ في المساعد الذكي",
        description: "لا يمكن الوصول لخدمة المساعد الذكي حالياً",
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
      title: "الإدخال الصوتي",
      description: "استخدم المساعد الصوتي في الصفحة الرئيسية للإدخال الصوتي المتقدم",
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
          المساعد الذكي
          <Badge variant="secondary" className="mr-auto">
            نشط
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
                    <p className="text-sm">{message.content}</p>
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
                      <span className="text-xs text-gray-500 mr-2">جاري التفكير...</span>
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
              placeholder="اكتب رسالتك هنا..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
              data-testid="input-ai-message"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceInput}
              data-testid="button-ai-voice"
              title="الإدخال الصوتي"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || sendMessageMutation.isPending}
              data-testid="button-ai-send"
              title="إرسال"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
