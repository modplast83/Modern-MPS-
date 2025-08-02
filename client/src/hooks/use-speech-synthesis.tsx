import { useState, useEffect, useRef } from 'react';

interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
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
}

export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices immediately
    updateVoices();

    // Also listen for voice changes (some browsers load voices asynchronously)
    speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, [isSupported]);

  const getArabicVoices = (): SpeechSynthesisVoice[] => {
    return voices.filter(voice => 
      voice.lang.startsWith('ar') || 
      voice.name.toLowerCase().includes('arabic') ||
      voice.name.toLowerCase().includes('عربي')
    );
  };

  const speak = (text: string, options: SpeechSynthesisOptions = {}) => {
    if (!isSupported || !text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set default options for Arabic
    const arabicVoices = getArabicVoices();
    const defaultVoice = arabicVoices.length > 0 ? arabicVoices[0] : null;

    utterance.voice = options.voice || defaultVoice;
    utterance.rate = options.rate || 0.9; // Slightly slower for Arabic
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'ar-SA';

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
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setIsPaused(false);
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
    getArabicVoices
  };
};