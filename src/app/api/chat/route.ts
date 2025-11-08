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
    console.log('🔍 DEBUG: /api/chat POST request received');

    const body = (await request.json()) as ChatRequest;
    const { message, conversationHistory = [], cookies } = body;

    console.log('📝 Message received:', message?.substring(0, 50) || '(empty)');
    console.log('📚 Conversation history length:', conversationHistory?.length || 0);
    console.log('🍪 Cookies provided:', !!cookies);

    if (!message || typeof message !== 'string') {
      console.log('❌ Validation failed: Message is required and must be a string');
      return NextResponse.json(
        { error: 'Message is required and must be a string', success: false },
        { status: 400 }
      );
    }

    if (!cookies || typeof cookies !== 'string') {
      console.log('❌ Validation failed: Cookies are required');
      return NextResponse.json(
        { error: 'Cookies are required to authenticate with Gemini', success: false },
        { status: 401 }
      );
    }

    console.log('✅ Request validation passed');
    const normalizedHistory = normalizeHistory(conversationHistory);
    console.log('📊 Normalized history to', normalizedHistory.length, 'messages');

    console.log('🚀 Calling sendGeminiChatRequest...');
    const geminiResponse = await sendGeminiChatRequest({
      cookies,
      message,
      conversationHistory: normalizedHistory,
    });

    console.log('✅ Got response from Gemini API');
    console.log(
      '📄 Response length:',
      geminiResponse.text?.length || 0,
      'characters'
    );

    const chatResponse: ChatResponse = {
      response: geminiResponse.text || 'Gemini did not return a response.',
      success: true,
    };

    console.log('✅ Returning chat response successfully');
    return NextResponse.json(chatResponse);
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorInstance.message;
    const errorStack = errorInstance.stack;

    console.error('❌ Chat API error:', errorMessage);
    console.error('Stack trace:', errorStack);

    if (error instanceof CookieValidationError) {
      console.log('🔐 CookieValidationError detected:', errorMessage);
      return NextResponse.json(
        { error: errorMessage, success: false },
        { status: 401 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Too many requests')) {
        console.log('⏱️ Rate limit error detected');
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.', success: false },
          { status: 429 }
        );
      }
    }

    console.error('💥 Unhandled error - returning 500');
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        success: false,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
