import { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function useTTS() {
  const { apiKey } = useChatStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateSpeech = async (text: string) => {
    if (!apiKey) {
      setError('API key is required for TTS');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return null;
      }

      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        return data.audioUrl;
      } else {
        setError('No audio data received');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch((error) => {
      console.error('Failed to play audio:', error);
      setError('Failed to play audio');
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
