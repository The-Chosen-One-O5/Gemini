import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatRequest, ChatResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get API key from request headers (sent from client)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Convert conversation history to Gemini format
    const history = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    // Send message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    const chatResponse: ChatResponse = {
      response: text,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Google AI Studio API key.' },
          { status: 401 }
        );
      }
      if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
          { status: 429 }
        );
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please check your Google AI Studio usage.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
