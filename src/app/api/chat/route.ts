import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse, Message } from '@/types';
import { sendGeminiChatRequest, CookieValidationError } from '@/server/geminiClient';

function normalizeHistory(history: Message[] = []): Message[] {
  return history
    .filter((message) => typeof message?.content === 'string' && !!message.content)
    .map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp ?? Date.now()),
    }));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { message, conversationHistory = [], cookies } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string', success: false },
        { status: 400 }
      );
    }

    if (!cookies || typeof cookies !== 'string') {
      return NextResponse.json(
        { error: 'Cookies are required to authenticate with Gemini', success: false },
        { status: 401 }
      );
    }

    const normalizedHistory = normalizeHistory(conversationHistory);

    const geminiResponse = await sendGeminiChatRequest({
      cookies,
      message,
      conversationHistory: normalizedHistory,
    });

    const chatResponse: ChatResponse = {
      response: geminiResponse.text || 'Gemini did not return a response.',
      success: true,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('Chat API error:', error instanceof Error ? error.message : error);

    if (error instanceof CookieValidationError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 401 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Too many requests')) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.', success: false },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.', success: false },
      { status: 500 }
    );
  }
}
