import { useState, useEffect, useRef } from "react";

interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  dialect?: "standard" | "egyptian" | "gulf" | "levantine" | "maghreb";
}

interface UseSpeechSynthesisReturn {
  speak: (text: string, options?: SpeechSynthesisOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  getArabicVoices: () => SpeechSynthesisVoice[];
  getVoicesByDialect: (dialect: string) => SpeechSynthesisVoice[];
  getAvailableDialects: () => string[];
}

export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>{t('hooks.use-speech-synthesis.([]);_const_utteranceref_=_useref')}<SpeechSynthesisUtterance | null>(null);

  const isSupported = "speechSynthesis" in window;

  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices immediately
    updateVoices();

    // Also listen for voice changes (some browsers load voices asynchronously)
    speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const getArabicVoices = (): SpeechSynthesisVoice[] => {
    return voices.filter(
      (voice) =>
        voice.lang.startsWith("ar") ||
        voice.name.toLowerCase().includes("arabic") ||
        voice.name.toLowerCase().includes("عربي"),
    );
  };

  const getVoicesByDialect = (dialect: string): SpeechSynthesisVoice[] => {
    const dialectLanguageCodes: Record<string, string[]> = {
      standard: ["ar-SA", "ar"],
      egyptian: ["ar-EG"],
      gulf: ["ar-SA", "ar-KW", "ar-AE", "ar-BH", "ar-QA"],
      levantine: ["ar-LB", "ar-SY", "ar-JO", "ar-PS"],
      maghreb: ["ar-MA", "ar-TN", "ar-DZ"],
      iraqi: ["ar-IQ"],
    };

    const targetLangCodes = dialectLanguageCodes[dialect] || ["ar-SA"];

    return voices.filter(
      (voice) =>
        targetLangCodes.some((code) => voice.lang.startsWith(code)) ||
        (voice.name.toLowerCase().includes("arabic") &&
          targetLangCodes.includes("ar")),
    );
  };

  const getAvailableDialects = (): string[] => {
    const availableDialects: string[] = [];
    const dialectsToCheck = [
      "standard",
      "egyptian",
      "gulf",
      "levantine",
      "maghreb",
      "iraqi",
    ];

    dialectsToCheck.forEach((dialect) => {
      if (getVoicesByDialect(dialect).length > 0) {
        availableDialects.push(dialect);
      }
    });

    return availableDialects.length > 0 ? availableDialects : ["standard"];
  };

  const speak = (text: string, options: SpeechSynthesisOptions = {}) => {
    if (!isSupported || !text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Get appropriate voice based on dialect
    const dialect = options.dialect || "standard";
    const dialectVoices = getVoicesByDialect(dialect);
    const arabicVoices = getArabicVoices();

    // Priority: dialect-specific voices > any Arabic voices > default
    const defaultVoice =
      dialectVoices.length > 0
        ? dialectVoices[0]
        : arabicVoices.length >{t('hooks.use-speech-synthesis.0_?_arabicvoices[0]_:_null;_utterance.voice_=_options.voice_||_defaultvoice;_utterance.rate_=_options.rate_||_(dialect_===_"egyptian"_?_1.0_:_0.9);_//_egyptian_dialect_can_be_faster_utterance.pitch_=_options.pitch_||_(dialect_===_"gulf"_?_1.1_:_1.0);_//_gulf_dialect_slightly_higher_pitch_utterance.volume_=_options.volume_||_1;_//_set_language_based_on_dialect_const_dialectlanguagemap:_record')}<string, string> = {
      standard: "ar-SA",
      egyptian: "ar-EG",
      gulf: "ar-SA",
      levantine: "ar-LB",
      maghreb: "ar-MA",
      iraqi: "ar-IQ",
    };

    utterance.lang = options.lang || dialectLanguageMap[dialect] || "ar-SA";

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", {
        error: event.error,
        type: event.type,
        text: text.substring(0, 50) + "...",
      });
      setIsSpeaking(false);
      setIsPaused(false);

      // Attempt to recover from common errors
      if (event.error === "interrupted" || event.error === "canceled") {
        // These are often recoverable, don't log as errors
        return;
      }

      // For other errors, provide user feedback
      console.warn(
        `Speech synthesis failed: ${event.error}. Text may be too long or voice unavailable.`,
      );
    };

    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const pause = () => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (isSupported && isPaused) {
      speechSynthesis.resume();
    }
  };

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    getArabicVoices,
    getVoicesByDialect,
    getAvailableDialects,
  };
};
