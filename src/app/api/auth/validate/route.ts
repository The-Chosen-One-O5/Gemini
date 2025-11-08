import { NextRequest, NextResponse } from 'next/server';
import { CookieValidationRequest, CookieValidationResponse } from '@/types';
import { validateGeminiCookies } from '@/server/geminiClient';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CookieValidationRequest;
  const cookies = body?.cookies;

  if (!cookies || typeof cookies !== 'string') {
    return NextResponse.json<CookieValidationResponse>(
      { valid: false, message: 'Cookie string is required.' },
      { status: 400 }
    );
  }

  try {
    const validation = await validateGeminiCookies(cookies);
    return NextResponse.json<CookieValidationResponse>(validation, {
      status: validation.valid ? 200 : 401,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate cookies.';
    return NextResponse.json<CookieValidationResponse>(
      { valid: false, message },
      { status: 500 }
    );
  }
}
