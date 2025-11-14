import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useSpeechRecognition } from "../../hooks/use-speech-recognition";
import { useSpeechSynthesis } from "../../hooks/use-speech-synthesis";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  AlertCircle,
  Globe,
} from "lucide-react";

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

type ArabicDialect = "standard" | "egyptian" | "gulf" | "levantine" | "maghreb";

export function VoiceAssistant() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [language, setLanguage] = useState<"ar-SA" | "en-US">{t('components.voice.VoiceAssistant.("ar-sa");_const_[selecteddialect,_setselecteddialect]_=_usestate')}<ArabicDialect>{t('components.voice.VoiceAssistant.("standard");_const_[commandhistory,_setcommandhistory]_=_usestate')}<VoiceCommand[]>{t('components.voice.VoiceAssistant.([]);_const_[currentresponse,_setcurrentresponse]_=_usestate')}<string>("");

  const queryClient = useQueryClient();

  const {
    transcript,
    isListening,
    hasRecognitionSupport,
    startListening,
    stopListening,
    resetTranscript,
    confidence,
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    language: language,
    dialect: language === "ar-SA" ? selectedDialect : undefined,
  });

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: isSpeechSupported,
    getArabicVoices,
    getVoicesByDialect,
    getAvailableDialects,
  } = useSpeechSynthesis();

  // AI Assistant mutation
  const aiMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await fetch("/api/ai/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          language,
          dialect: language === "ar-SA" ? selectedDialect : undefined,
          context: "voice_assistant",
        }),
      });

      if (!response.ok) {
        throw new Error("فشل في معالجة الأمر الصوتي");
      }

      return response.json() as Promise<AIResponse>;
    },
    onSuccess: (data, command) => {
      const newCommand: VoiceCommand = {
        command,
        confidence,
        timestamp: new Date(),
        response: data.message,
      };

      setCommandHistory((prev) => [newCommand, ...prev.slice(0, 9)]);
      setCurrentResponse(data.message);

      // Speak the response with selected dialect
      if (isEnabled && data.message) {
        speak(data.message, {
          lang: language,
          dialect: language === "ar-SA" ? selectedDialect : undefined,
        });
      }

      // Execute any actions
      if (data.action) {
        executeVoiceAction(data.action, data.data);
      }
    },
    onError: (error) => {
      const errorMsg =
        language === "ar-SA"
          ? "عذراً، لم أتمكن من فهم الأمر"
          : "Sorry, I could not understand the command";

      setCurrentResponse(errorMsg);
      if (isEnabled) {
        speak(errorMsg, {
          lang: language,
          dialect: language === "ar-SA" ? selectedDialect : undefined,
        });
      }
    },
  });

  // Process voice command when transcript is final
  useEffect(() => {
    if (
      transcript &&
      !isListening &&
      transcript.trim().length > 2 &&
      isEnabled
    ) {
      aiMutation.mutate(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, isEnabled]);

  const executeVoiceAction = (action: string, data: any) => {
    switch (action) {
      case "navigate":
        if (data?.route) {
          window.location.href = data.route;
        }
        break;
      case "refresh_data":
        if (data?.queryKey) {
          queryClient.invalidateQueries({ queryKey: [data.queryKey] });
        }
        break;
      case "show_stats":
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        break;
      default:
        console.log("Unknown voice action:", action);
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
    const newLang = language === "ar-SA" ? "en-US" : "ar-SA";
    setLanguage(newLang);

    const message =
      newLang === "ar-SA"
        ? "تم تغيير اللغة إلى العربية"
        : "Language changed to English";

    speak(message, {
      lang: newLang,
      dialect: newLang === "ar-SA" ? selectedDialect : undefined,
    });
  };

  const handleDialectChange = (newDialect: ArabicDialect) => {
    setSelectedDialect(newDialect);

    const dialectNames: Record<ArabicDialect, string> = {
      standard: "العربية الفصحى",
      egyptian: "اللهجة المصرية",
      gulf: "اللهجة الخليجية",
      levantine: "اللهجة الشامية",
      maghreb: "اللهجة المغاربية",
    };

    const message = `تم تغيير اللهجة إلى ${dialectNames[newDialect]}`;
    speak(message, { dialect: newDialect });
  };

  if (!hasRecognitionSupport || !isSpeechSupported) {
    return (
      <Card className={t("components.voice.voiceassistant.name.w_full_max_w_md")}>
        <CardContent className={t("components.voice.voiceassistant.name.pt_6")}>
          <div className={t("components.voice.voiceassistant.name.text_center_text_muted_foreground")}>
            <AlertCircle className={t("components.voice.voiceassistant.name.mx_auto_h_8_w_8_mb_2")} />
            <p className={t("components.voice.voiceassistant.name.text_sm")}>
              {language === "ar-SA"
                ? "المتصفح لا يدعم الأوامر الصوتية"
                : "Voice commands not supported in this browser"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={t("components.voice.voiceassistant.name.space_y_4")}>
      {/* Main Voice Control */}
      <Card className={t("components.voice.voiceassistant.name.w_full")}>
        <CardHeader className={t("components.voice.voiceassistant.name.pb_3")}>
          <div className={t("components.voice.voiceassistant.name.flex_items_center_justify_between")}>
            <CardTitle className={t("components.voice.voiceassistant.name.text_lg_flex_items_center_gap_2")}>
              <MessageSquare className={t("components.voice.voiceassistant.name.h_5_w_5")} />
              {language === "ar-SA" ? "المساعد الصوتي" : "Voice Assistant"}
            </CardTitle>

            <div className={t("components.voice.voiceassistant.name.flex_items_center_gap_2")}>
              {/* Dialect Selector for Arabic */}
              {language === "ar-SA" && (
                <Select
                  value={selectedDialect}
                  onValueChange={(value: ArabicDialect) =>
                    handleDialectChange(value)
                  }
                >
                  <SelectTrigger className={t("components.voice.voiceassistant.name.w_140px_h_8")}>
                    <Globe className={t("components.voice.voiceassistant.name.h_4_w_4_mr_1")} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{t('components.voice.VoiceAssistant.العربية_الفصحى')}</SelectItem>
                    <SelectItem value="egyptian">{t('components.voice.VoiceAssistant.المصرية')}</SelectItem>
                    <SelectItem value="gulf">{t('components.voice.VoiceAssistant.الخليجية')}</SelectItem>
                    <SelectItem value="levantine">{t('components.voice.VoiceAssistant.الشامية')}</SelectItem>
                    <SelectItem value="maghreb">{t('components.voice.VoiceAssistant.المغاربية')}</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className={t("components.voice.voiceassistant.name.gap_2")}
              >
                <Languages className={t("components.voice.voiceassistant.name.h_4_w_4")} />
                {language === "ar-SA" ? "عربي" : "EN"}
              </Button>

              <Button
                variant={isEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleVoiceAssistant}
                className={t("components.voice.voiceassistant.name.gap_2")}
              >
                <Settings className={t("components.voice.voiceassistant.name.h_4_w_4")} />
                {isEnabled
                  ? language === "ar-SA"
                    ? "مفعل"
                    : "ON"
                  : language === "ar-SA"
                    ? "غير مفعل"
                    : "OFF"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={t("components.voice.voiceassistant.name.space_y_4")}>
          {/* Voice Input Control */}
          <div className={t("components.voice.voiceassistant.name.flex_items_center_gap_3")}>
            <Button
              variant={isListening ? "destructive" : "default"}
              size="lg"
              onClick={handleVoiceInput}
              disabled={!isEnabled || aiMutation.isPending}
              className={t("components.voice.voiceassistant.name.gap_2")}
            >
              {isListening ? (
                <>
                  <MicOff className={t("components.voice.voiceassistant.name.h_5_w_5")} />
                  {language === "ar-SA" ? "إيقاف" : "Stop"}
                </>{t('components.voice.VoiceAssistant.)_:_(')}<>
                  <Mic className={t("components.voice.voiceassistant.name.h_5_w_5")} />
                  {language === "ar-SA" ? "تحدث" : "Speak"}
                </>
              )}
            </Button>

            {isSpeaking && (
              <Button
                variant="outline"
                onClick={stopSpeaking}
                className={t("components.voice.voiceassistant.name.gap_2")}
              >
                <VolumeX className={t("components.voice.voiceassistant.name.h_4_w_4")} />
                {language === "ar-SA" ? "إيقاف الصوت" : "Stop Audio"}
              </Button>
            )}

            {aiMutation.isPending && (
              <div className={t("components.voice.voiceassistant.name.flex_items_center_gap_2_text_sm_text_muted_foreground")}>
                <Loader2 className={t("components.voice.voiceassistant.name.h_4_w_4_animate_spin")} />
                {language === "ar-SA" ? "جاري المعالجة..." : "Processing..."}
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {(transcript || isListening) && (
            <div className={t("components.voice.voiceassistant.name.p_3_bg_muted_rounded_lg")}>
              <div className={t("components.voice.voiceassistant.name.flex_items_center_gap_2_mb_2")}>
                <Mic className={t("components.voice.voiceassistant.name.h_4_w_4_text_blue_500")} />
                <span className={t("components.voice.voiceassistant.name.text_sm_font_medium")}>
                  {language === "ar-SA" ? "النص المسموع:" : "Transcript:"}
                </span>
                {confidence >{t('components.voice.VoiceAssistant.0_&&_(')}<Badge variant="secondary" className={t("components.voice.voiceassistant.name.text_xs")}>
                    {Math.round(confidence * 100)}%
                  </Badge>
                )}
              </div>
              <p className={t("components.voice.voiceassistant.name.text_sm")}>
                {transcript ||
                  (language === "ar-SA" ? "استمع..." : "Listening...")}
              </p>
            </div>
          )}

          {/* Current Response */}
          {currentResponse && (
            <div className={t("components.voice.voiceassistant.name.p_3_bg_blue_50_dark_bg_blue_950_rounded_lg")}>
              <div className={t("components.voice.voiceassistant.name.flex_items_center_gap_2_mb_2")}>
                <Volume2 className={t("components.voice.voiceassistant.name.h_4_w_4_text_blue_500")} />
                <span className={t("components.voice.voiceassistant.name.text_sm_font_medium_text_blue_700_dark_text_blue_300")}>
                  {language === "ar-SA" ? "رد المساعد:" : "Assistant Response:"}
                </span>
              </div>
              <p className={t("components.voice.voiceassistant.name.text_sm_text_blue_800_dark_text_blue_200")}>
                {currentResponse}
              </p>
            </div>
          )}

          {/* Voice Commands Help with Dialect Examples */}
          <div className={t("components.voice.voiceassistant.name.text_xs_text_muted_foreground")}>
            <p className={t("components.voice.voiceassistant.name.font_medium_mb_1")}>
              {language === "ar-SA"
                ? "أمثلة على الأوامر الصوتية:"
                : "Voice command examples:"}
            </p>
            <ul className={t("components.voice.voiceassistant.name.space_y_1")}>
              {language === "ar-SA" ? (
                selectedDialect === "egyptian" ? (
                  <>
                    <li>{t('components.voice.VoiceAssistant.•_"وريني_إحصائيات_الإنتاج"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"روح_لصفحة_الطلبات"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"إيه_حالة_المكن؟"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"اعمل_طلب_جديد"')}</li>
                  </>{t('components.voice.VoiceAssistant.)_:_selecteddialect_===_"gulf"_?_(')}<>
                    <li>{t('components.voice.VoiceAssistant.•_"خلني_أشوف_إحصائيات_الإنتاج"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"روح_لصفحة_الطلبيات"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"شلون_حالة_المكائن؟"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"سوي_طلب_جديد"')}</li>
                  </>{t('components.voice.VoiceAssistant.)_:_selecteddialect_===_"levantine"_?_(')}<>
                    <li>{t('components.voice.VoiceAssistant.•_"فيني_شوف_إحصائيات_الإنتاج"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"روح_عصفحة_الطلبات"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"شو_وضع_المكائن؟"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"اعمل_طلب_جديد"')}</li>
                  </>{t('components.voice.VoiceAssistant.)_:_(')}<>
                    <li>{t('components.voice.VoiceAssistant.•_"اعرض_لي_إحصائيات_الإنتاج"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"انتقل_إلى_صفحة_الطلبات"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"ما_هي_حالة_المكائن؟"')}</li>
                    <li>{t('components.voice.VoiceAssistant.•_"أضف_طلب_جديد"')}</li>
                  </>{t('components.voice.VoiceAssistant.)_)_:_(')}<>
                  <li>{t('components.voice.VoiceAssistant.•_"show_production_statistics"')}</li>
                  <li>{t('components.voice.VoiceAssistant.•_"go_to_orders_page"')}</li>
                  <li>{t('components.voice.VoiceAssistant.•_"what_is_the_machine_status?"')}</li>
                  <li>{t('components.voice.VoiceAssistant.•_"add_new_order"')}</li>
                </>
              )}
            </ul>

            {language === "ar-SA" && selectedDialect !== "standard" && (
              <p className={t("components.voice.voiceassistant.name.mt_2_text_xs_text_blue_600_dark_text_blue_400")}>
                💡 يمكنك استخدام اللهجة{" "}
                {selectedDialect === "egyptian"
                  ? "المصرية"
                  : selectedDialect === "gulf"
                    ? "الخليجية"
                    : selectedDialect === "levantine"
                      ? "الشامية"
                      : "المغاربية"}{" "}
                أو العربية الفصحى
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      {commandHistory.length >{t('components.voice.VoiceAssistant.0_&&_(')}<Card>
          <CardHeader className={t("components.voice.voiceassistant.name.pb_3")}>
            <CardTitle className={t("components.voice.voiceassistant.name.text_base")}>
              {language === "ar-SA" ? "سجل الأوامر" : "Command History"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("components.voice.voiceassistant.name.space_y_2_max_h_60_overflow_y_auto")}>
              {commandHistory.map((cmd, index) => (
                <div key={index} className={t("components.voice.voiceassistant.name.p_2_bg_muted_rounded_text_sm")}>
                  <div className={t("components.voice.voiceassistant.name.flex_items_center_justify_between_mb_1")}>
                    <span className={t("components.voice.voiceassistant.name.font_medium")}>{cmd.command}</span>
                    <div className={t("components.voice.voiceassistant.name.flex_items_center_gap_1")}>
                      <Badge variant="outline" className={t("components.voice.voiceassistant.name.text_xs")}>
                        {Math.round(cmd.confidence * 100)}%
                      </Badge>
                      <CheckCircle className={t("components.voice.voiceassistant.name.h_3_w_3_text_green_500")} />
                    </div>
                  </div>
                  {cmd.response && (
                    <p className={t("components.voice.voiceassistant.name.text_muted_foreground_text_xs")}>
                      {cmd.response}
                    </p>
                  )}
                  <span className={t("components.voice.voiceassistant.name.text_xs_text_muted_foreground")}>
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
