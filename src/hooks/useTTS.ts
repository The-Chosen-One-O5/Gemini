import { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function useTTS() {
  const {
    cookies,
    cookieStatus,
    shouldRefreshCookies,
    setCookieStatus,
    markCookiesValidated,
  } = useChatStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateSpeech = async (text: string) => {
    if (!text.trim()) {
      setError('Nothing to convert to speech.');
      return null;
    }

    if (!cookies) {
      setError('Gemini cookies are required for text-to-speech.');
      return null;
    }

    if (cookieStatus === 'invalid') {
      setError('Your Gemini cookies are invalid. Please refresh them before using TTS.');
      return null;
    }

    if (cookieStatus === 'expired' || shouldRefreshCookies()) {
      setCookieStatus('expired');
      setError('Your Gemini cookies need to be refreshed. Please update them before using TTS.');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, cookies }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        const errorMessage =
          data?.error ||
          (response.status === 401 || response.status === 403
            ? 'Cookies expired or invalid. Please refresh them from gemini.google.com.'
            : response.status === 429
            ? 'Too many requests. Please try again later.'
            : 'Failed to generate speech. Please try again.');

        if (response.status === 401 || response.status === 403) {
          setCookieStatus('invalid');
        }

        setError(errorMessage);
        return null;
      }

      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        markCookiesValidated();
        return data.audioUrl as string;
      }

      setError('No audio data received.');
      return null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate speech. Please try again.';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch((playError) => {
      console.error('Failed to play audio:', playError);
      setError('Failed to play audio.');
    });
  };

  const generateAndPlay = async (text: string) => {
    const url = await generateSpeech(text);
    if (url) {
      playAudio(url);
    }
  };

  const clearError = () => setError(null);

  return {
    generateSpeech,
    generateAndPlay,
    playAudio,
    isGenerating,
    error,
    clearError,
    audioUrl,
  };
}
