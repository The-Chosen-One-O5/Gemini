import { NextRequest, NextResponse } from 'next/server';
import { TTSRequest, TTSResponse } from '@/types';
import { sendGeminiTTSRequest, CookieValidationError } from '@/server/geminiClient';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TTSRequest;
    const { text, cookies } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string', success: false },
        { status: 400 }
      );
    }

    if (!cookies || typeof cookies !== 'string') {
      return NextResponse.json(
        { error: 'Cookies are required to authenticate with Gemini', success: false },
        { status: 401 }
      );
    }

    const tts = await sendGeminiTTSRequest(cookies, text);

    if (!tts.audioBase64 || !tts.mimeType) {
      const response: TTSResponse = {
        success: false,
        error: 'Gemini did not return audio data. Please try again later.',
      };
      return NextResponse.json(response, { status: 502 });
    }

    const audioUrl = `data:${tts.mimeType};base64,${tts.audioBase64}`;

    const response: TTSResponse = {
      success: true,
      audioUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('TTS API error:', error instanceof Error ? error.message : error);

    if (error instanceof CookieValidationError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Too many requests')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', success: false },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate audio. Please try again.', success: false },
      { status: 500 }
    );
  }
}
