'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceRecognitionOptions {
  onResult: (text: string) => void;
  onInterimResult?: (text: string) => void;
  lang?: string;
}

export function useVoiceRecognition({
  onResult,
  onInterimResult,
  lang = 'pt-BR',
}: UseVoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechBusyRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  useEffect(() => {
    const onSpeechStart = () => {
      speechBusyRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try { recognitionRef.current?.abort(); } catch {}
      setIsListening(false);
      setInterimText('');
    };
    const onSpeechEnd = () => {
      speechBusyRef.current = false;
    };
    window.addEventListener('detetive:speech-start', onSpeechStart);
    window.addEventListener('detetive:speech-end', onSpeechEnd);
    return () => {
      window.removeEventListener('detetive:speech-start', onSpeechStart);
      window.removeEventListener('detetive:speech-end', onSpeechEnd);
    };
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || speechBusyRef.current) return;

    // Cancel any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (speechBusyRef.current) return;
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        onInterimResult?.(interim);
      }

      if (final) {
        setInterimText('');
        onResult(final.trim());
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.warn('[voice] error:', event.error);
      }
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }

    // Auto-stop after 15s
    timeoutRef.current = setTimeout(() => {
      recognition.stop();
    }, 15000);
  }, [lang, onResult, onInterimResult]);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  return { isListening, isSupported, interimText, startListening, stopListening };
}
