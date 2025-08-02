import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare,
  Settings,
  Languages,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: Date;
  response?: string;
}

interface AIResponse {
  message: string;
  action?: string;
  data?: any;
}

export function VoiceAssistant() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [language, setLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');

  const queryClient = useQueryClient();

  const {
    transcript,
    isListening,
    hasRecognitionSupport,
    startListening,
    stopListening,
    resetTranscript,
    confidence
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    language: language
  });

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: isSpeechSupported,
    getArabicVoices
  } = useSpeechSynthesis();

  // AI Assistant mutation
  const aiMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command,
          language,
          context: 'voice_assistant'
        })
      });
      
      if (!response.ok) {
        throw new Error('فشل في معالجة الأمر الصوتي');
      }
      
      return response.json() as Promise<AIResponse>;
    },
    onSuccess: (data, command) => {
      const newCommand: VoiceCommand = {
        command,
        confidence,
        timestamp: new Date(),
        response: data.message
      };
      
      setCommandHistory(prev => [newCommand, ...prev.slice(0, 9)]);
      setCurrentResponse(data.message);
      
      // Speak the response
      if (isEnabled && data.message) {
        speak(data.message, { lang: language });
      }

      // Execute any actions
      if (data.action) {
        executeVoiceAction(data.action, data.data);
      }
    },
    onError: (error) => {
      const errorMsg = language === 'ar-SA' 
        ? 'عذراً، لم أتمكن من فهم الأمر' 
        : 'Sorry, I could not understand the command';
      
      setCurrentResponse(errorMsg);
      if (isEnabled) {
        speak(errorMsg, { lang: language });
      }
    }
  });

  // Process voice command when transcript is final
  useEffect(() => {
    if (transcript && !isListening && transcript.trim().length > 2 && isEnabled) {
      aiMutation.mutate(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, isEnabled]);

  const executeVoiceAction = (action: string, data: any) => {
    switch (action) {
      case 'navigate':
        if (data?.route) {
          window.location.href = data.route;
        }
        break;
      case 'refresh_data':
        if (data?.queryKey) {
          queryClient.invalidateQueries({ queryKey: [data.queryKey] });
        }
        break;
      case 'show_stats':
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;
      default:
        console.log('Unknown voice action:', action);
    }
  };

  const toggleVoiceAssistant = () => {
    if (isEnabled) {
      stopListening();
      stopSpeaking();
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar-SA' ? 'en-US' : 'ar-SA';
    setLanguage(newLang);
    
    const message = newLang === 'ar-SA' 
      ? 'تم تغيير اللغة إلى العربية' 
      : 'Language changed to English';
    
    speak(message, { lang: newLang });
  };

  if (!hasRecognitionSupport || !isSpeechSupported) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">
              {language === 'ar-SA' 
                ? 'المتصفح لا يدعم الأوامر الصوتية'
                : 'Voice commands not supported in this browser'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Voice Control */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {language === 'ar-SA' ? 'المساعد الصوتي' : 'Voice Assistant'}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="gap-2"
              >
                <Languages className="h-4 w-4" />
                {language === 'ar-SA' ? 'عربي' : 'EN'}
              </Button>
              
              <Button
                variant={isEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleVoiceAssistant}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                {isEnabled 
                  ? (language === 'ar-SA' ? 'مفعل' : 'ON') 
                  : (language === 'ar-SA' ? 'غير مفعل' : 'OFF')
                }
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Voice Input Control */}
          <div className="flex items-center gap-3">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="lg"
              onClick={handleVoiceInput}
              disabled={!isEnabled || aiMutation.isPending}
              className="gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="h-5 w-5" />
                  {language === 'ar-SA' ? 'إيقاف' : 'Stop'}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  {language === 'ar-SA' ? 'تحدث' : 'Speak'}
                </>
              )}
            </Button>

            {isSpeaking && (
              <Button
                variant="outline"
                onClick={stopSpeaking}
                className="gap-2"
              >
                <VolumeX className="h-4 w-4" />
                {language === 'ar-SA' ? 'إيقاف الصوت' : 'Stop Audio'}
              </Button>
            )}

            {aiMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === 'ar-SA' ? 'جاري المعالجة...' : 'Processing...'}
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {(transcript || isListening) && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  {language === 'ar-SA' ? 'النص المسموع:' : 'Transcript:'}
                </span>
                {confidence > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(confidence * 100)}%
                  </Badge>
                )}
              </div>
              <p className="text-sm">
                {transcript || (language === 'ar-SA' ? 'استمع...' : 'Listening...')}
              </p>
            </div>
          )}

          {/* Current Response */}
          {currentResponse && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {language === 'ar-SA' ? 'رد المساعد:' : 'Assistant Response:'}
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {currentResponse}
              </p>
            </div>
          )}

          {/* Voice Commands Help */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">
              {language === 'ar-SA' ? 'أمثلة على الأوامر الصوتية:' : 'Voice command examples:'}
            </p>
            <ul className="space-y-1">
              {language === 'ar-SA' ? (
                <>
                  <li>• "اعرض لي إحصائيات الإنتاج"</li>
                  <li>• "انتقل إلى صفحة الطلبات"</li>
                  <li>• "ما هي حالة المكائن؟"</li>
                  <li>• "أضف طلب جديد"</li>
                </>
              ) : (
                <>
                  <li>• "Show production statistics"</li>
                  <li>• "Go to orders page"</li>
                  <li>• "What is the machine status?"</li>
                  <li>• "Add new order"</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {language === 'ar-SA' ? 'سجل الأوامر' : 'Command History'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {commandHistory.map((cmd, index) => (
                <div key={index} className="p-2 bg-muted rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{cmd.command}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(cmd.confidence * 100)}%
                      </Badge>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                  {cmd.response && (
                    <p className="text-muted-foreground text-xs">
                      {cmd.response}
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {cmd.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}