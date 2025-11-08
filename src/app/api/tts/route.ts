import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TTSRequest, TTSResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Get API key from request headers
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

    // Generate audio using Gemini's capabilities
    const prompt = `Generate audio for the following text: "${text}". Return the audio data that can be played as speech.`;
    
    await model.generateContent(prompt);
    
    // Note: Gemini 2.0 doesn't have native TTS yet, so we'll return a simulated response
    // In a real implementation, you would use Google Cloud Text-to-Speech API
    const ttsResponse: TTSResponse = {
      error: 'TTS feature is currently under development. Please check back later.',
    };

    return NextResponse.json(ttsResponse);
  } catch (error) {
    console.error('TTS API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Google AI Studio API key.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate audio. Please try again.' },
      { status: 500 }
    );
  }
}
