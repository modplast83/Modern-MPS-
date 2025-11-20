import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  dialect?: "standard" | "egyptian" | "gulf" | "levantine" | "maghreb";
  maxAlternatives?: number;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  hasRecognitionSupport: boolean;
  startListening: () => void;
  stopListening: () => void;
  abortListening: () => void;
  resetTranscript: () => void;
  confidence: number;
  error: string | null;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any; // SpeechGrammarList not widely supported
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

export const useSpeechRecognition = (
  options: SpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManualStopRef = useRef(false);

  // Check for browser support
  const hasRecognitionSupport =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const getLanguageCode = useCallback(
    (language: string, dialect?: string): string => {
      if (language === "ar-SA" && dialect) {
        const dialectLanguageMap: Record<string, string> = {
          standard: "ar-SA",
          egyptian: "ar-EG",
          gulf: "ar-SA", // Using SA as primary Gulf dialect
          levantine: "ar-LB", // Using Lebanon as primary Levantine
          maghreb: "ar-MA", // Using Morocco as primary Maghreb
        };
        return dialectLanguageMap[dialect] || "ar-SA";
      }
      return language || "ar-SA";
    },
    [],
  );

  const initializeRecognition = useCallback(() => {
    if (!hasRecognitionSupport) return null;

    try {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) return null;

      const recognition = new SpeechRecognitionConstructor();

      // Configure recognition
      recognition.continuous = options.continuous ?? false;
      recognition.interimResults = options.interimResults ?? true;
      recognition.maxAlternatives = options.maxAlternatives ?? 1;
      recognition.lang = getLanguageCode(
        options.language || "ar-SA",
        options.dialect,
      );

      return recognition;
    } catch (e) {
      console.warn("Failed to initialize speech recognition:", e);
      return null;
    }
  }, [hasRecognitionSupport, options, getLanguageCode]);

  const initializeRecognitionWithHandlers = useCallback(() => {
    const recognition = initializeRecognition();
    if (!recognition) return null;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      isManualStopRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimResult = "";
      let finalResult = "";
      let latestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalResult += transcriptText;
          latestConfidence = result[0].confidence;
        } else {
          interimResult += transcriptText;
        }
      }

      setInterimTranscript(interimResult);

      if (finalResult) {
        setFinalTranscript((prev) => prev + finalResult);
        setTranscript((prev) => prev + finalResult);
        setConfidence(latestConfidence);
      } else {
        // Update full transcript for live display
        const currentFinal = finalTranscript || "";
        setTranscript(currentFinal + interimResult);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error);
      setIsListening(false);

      // Handle specific error cases
      switch (event.error) {
        case "network":
          setError("Network error occurred");
          break;
        case "not-allowed":
          setError("Microphone access denied");
          break;
        case "no-speech":
          setError("No speech was detected");
          break;
        case "audio-capture":
          setError("Audio capture failed");
          break;
        case "service-not-allowed":
          setError("Speech recognition service not allowed");
          break;
        default:
          setError(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      // Auto-restart if continuous mode and not manually stopped
      if (options.continuous && !isManualStopRef.current && !error) {
        setTimeout(() => {
          if (recognitionRef.current && !isManualStopRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Failed to restart recognition:", e);
            }
          }
        }, 100);
      }
    };

    recognition.onnomatch = () => {
      setError("No match found");
    };

    recognition.onaudiostart = () => {
      setError(null);
    };

    recognition.onaudioend = () => {
      // Audio input ended
    };

    recognition.onsoundstart = () => {
      // Sound detected
    };

    recognition.onsoundend = () => {
      // Sound ended
    };

    recognition.onspeechstart = () => {
      // Speech detected
    };

    recognition.onspeechend = () => {
      // Speech ended
    };

    return recognition;
  }, [options, hasRecognitionSupport, getLanguageCode, finalTranscript, error]);

  const startListening = useCallback(() => {
    if (!hasRecognitionSupport) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) return;

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognitionWithHandlers();
      }

      if (recognitionRef.current) {
        // Update language before starting
        recognitionRef.current.lang = getLanguageCode(
          options.language || "ar-SA",
          options.dialect,
        );
        recognitionRef.current.start();
      } else {
        setError("Failed to initialize speech recognition");
      }
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setError("Failed to start speech recognition");
      setIsListening(false);
    }
  }, [
    hasRecognitionSupport,
    isListening,
    initializeRecognitionWithHandlers,
    getLanguageCode,
    options.language,
    options.dialect,
  ]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isManualStopRef.current = true;
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      isManualStopRef.current = true;
      recognitionRef.current.abort();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setFinalTranscript("");
    setConfidence(0);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isManualStopRef.current = true;
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Update recognition when options change
  useEffect(() => {
    if (recognitionRef.current && hasRecognitionSupport) {
      try {
        recognitionRef.current.continuous = options.continuous ?? false;
        recognitionRef.current.interimResults = options.interimResults ?? true;
        recognitionRef.current.maxAlternatives = options.maxAlternatives ?? 1;
        recognitionRef.current.lang = getLanguageCode(
          options.language || "ar-SA",
          options.dialect,
        );
      } catch (e) {
        console.warn("Failed to update recognition options:", e);
      }
    }
  }, [options, hasRecognitionSupport, getLanguageCode]);

  return {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    hasRecognitionSupport,
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    confidence,
    error,
  };
};
