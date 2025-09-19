import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import ErrorBoundary from "../ErrorBoundary";
import { Bot, User, Send, Mic, MicOff, Volume2, FileText, Bell, TrendingUp, Settings } from "lucide-react";
import { generateMessageId } from "../../../../shared/id-generator";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `🤖 مرحباً! أنا مساعدك الذكي المتطور في نظام MPBF Next.

**قدراتي المتقدمة:**
🗄️ **إدارة قاعدة البيانات الكاملة** - إضافة، تعديل، حذف جميع السجلات
📊 **التقارير الذكية** - تحليل البيانات وإنشاء تقارير تفاعلية  
🔔 **النظام الذكي للإشعارات** - تنبيهات تلقائية حسب الحاجة
🧠 **التعلم المستمر** - تحسين الأداء من خلال تحليل أنماط العمل
⚙️ **التطوير الذاتي** - تحسين وتطوير وظائف النظام

**أمثلة على ما يمكنني فعله:**
• "أضف عميل جديد اسمه أحمد محمد من الرياض"
• "اعرض لي تقرير الإنتاج لهذا الأسبوع"  
• "حدث حالة الطلب رقم ORD-123 إلى مكتمل"
• "احذف المكينة رقم 5"
• "أرسل تنبيه صيانة للمكائن المتوقفة"

كيف يمكنني مساعدتك اليوم؟`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const { toast } = useToast();

  // إجراءات سريعة للمساعد الذكي
  const quickActions = [
    { 
      label: 'تقرير الإنتاج', 
      icon: TrendingUp, 
      command: 'اعرض لي تقرير الإنتاج الذكي',
      description: 'تحليل شامل للإنتاج مع توصيات'
    },
    { 
      label: 'إضافة عميل', 
      icon: User, 
      command: 'أضف عميل جديد',
      description: 'إضافة عميل جديد بالذكاء الاصطناعي'
    },
    { 
      label: 'فحص الإشعارات', 
      icon: Bell, 
      command: 'اعرض الإشعارات والتنبيهات النشطة',
      description: 'مراجعة التنبيهات الذكية'
    },
    { 
      label: 'حالة المكائن', 
      icon: Settings, 
      command: 'ما هي حالة المكائن حالياً؟',
      description: 'مراجعة حالة جميع المكائن'
    }
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, context: 'factory_operations', userId: 1 })
      });
      return response.json();
    },
    onSuccess: (response: any) => {
      const assistantMessage: Message = {
        id: generateMessageId(),
        type: 'assistant',
        content: response.reply || 'عذراً، لم أستطع معالجة طلبك في الوقت الحالي.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: generateMessageId(),
        type: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "خطأ في المساعد الذكي",
        description: "لا يمكن الوصول لخدمة المساعد الذكي حالياً",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend) return;

    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(messageToSend);
    setInputValue('');
    setShowQuickActions(false);
  };

  const handleQuickAction = (command: string) => {
    handleSendMessage(command);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      // Start voice recognition
      setIsListening(true);
      toast({
        title: "الاستماع نشط",
        description: "تحدث الآن..."
      });
      
      // Simulate voice recognition (replace with actual implementation)
      const timeoutId = setTimeout(() => {
        setIsListening(false);
        setInputValue("ما هو حالة الإنتاج اليوم؟");
      }, 3000);
      
      // Store timeout ID for cleanup
      (window as any).__voiceTimeout = timeoutId;
    } else {
      setIsListening(false);
      // Clear any pending timeout
      if ((window as any).__voiceTimeout) {
        clearTimeout((window as any).__voiceTimeout);
        (window as any).__voiceTimeout = null;
      }
    }
  };

  const speakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'ar-SA';
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
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    {message.type === 'assistant' && (
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
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceInput}
              className={isListening ? 'bg-red-100 text-red-600' : ''}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || sendMessageMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}