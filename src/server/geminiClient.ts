import crypto from 'crypto';
import { Message } from '@/types';
import { getCookieValue, hasRequiredCookieTokens, sanitizeCookieString } from '@/lib/cookieUtils';

/**
 * Gemini web client utilities using the same cookie-authenticated endpoints that power gemini.google.com.
 * Authentication is handled by computing the SAPISIDHASH header from the user's Gemini cookies.
 */
const DEFAULT_CHAT_ENDPOINT = 'https://generativelanguage.googleapis.com/app/v1beta/models/gemini-2.0-flash-exp:generateContent?alt=json';
const DEFAULT_TTS_ENDPOINT = DEFAULT_CHAT_ENDPOINT;

const GEMINI_CHAT_ENDPOINT = process.env.GEMINI_CHAT_ENDPOINT || DEFAULT_CHAT_ENDPOINT;
const GEMINI_TTS_ENDPOINT = process.env.GEMINI_TTS_ENDPOINT || DEFAULT_TTS_ENDPOINT;

const GEMINI_ORIGIN = 'https://gemini.google.com';
const GEMINI_REFERER = 'https://gemini.google.com/app';

const USER_AGENT =
  process.env.GEMINI_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

interface GeminiRequestOptions {
  cookies: string;
  payload: Record<string, unknown>;
  endpoint?: string;
}

export interface GeminiChatRequest {
  cookies: string;
  message: string;
  conversationHistory: Message[];
}

export interface GeminiChatResponse {
  text: string;
  raw: any;
}

export interface GeminiTTSResponse {
  audioBase64: string | null;
  mimeType: string | null;
  raw: any;
}

class CookieValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CookieValidationError';
  }
}

function assertRequiredCookies(cookies: string) {
  if (!cookies || !cookies.trim()) {
    throw new CookieValidationError('Missing cookie string. Please paste your Gemini session cookies.');
  }

  if (!hasRequiredCookieTokens(cookies)) {
    throw new CookieValidationError('Please paste valid Gemini cookies from gemini.google.com. Cookies should include PSID, NID, or __Secure-* tokens.');
  }
}

function createSapSidHash(cookies: string): string {
  const sanitized = sanitizeCookieString(cookies);
  const sapisid =
    getCookieValue(sanitized, 'SAPISID') ||
    getCookieValue(sanitized, '__Secure-3PSID') ||
    getCookieValue(sanitized, '__Secure-1PSID');

  if (!sapisid) {
    throw new CookieValidationError('Required cookie SAPISID/__Secure-1PSID not found. Please ensure you copied all cookies.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const hashData = `${timestamp} ${sapisid} ${GEMINI_ORIGIN}`;
  const hash = crypto.createHash('sha1').update(hashData).digest('hex');
  return `${timestamp}_${hash}`;
}

function buildHeaders(cookies: string): Record<string, string> {
  const sanitizedCookies = sanitizeCookieString(cookies);
  const sapSidHash = createSapSidHash(sanitizedCookies);

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Cookie: sanitizedCookies,
    Origin: GEMINI_ORIGIN,
    Referer: GEMINI_REFERER,
    'User-Agent': USER_AGENT,
    Authorization: `SAPISIDHASH ${sapSidHash}`,
    'x-origin': GEMINI_ORIGIN,
    'x-goog-authuser': '0',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };
}

function buildContents(history: Message[], message: string) {
  const contents = history
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  return contents;
}

function parseGeminiText(data: any): string {
  if (!data) {
    return '';
  }

  if (Array.isArray(data.candidates)) {
    for (const candidate of data.candidates) {
      const parts = candidate?.content?.parts;
      if (Array.isArray(parts)) {
        const text = parts
          .map((part: any) => part?.text || part?.generated_text || '')
          .filter(Boolean)
          .join('\n');
        if (text) {
          return text;
        }
      }
    }
  }

  if (typeof data.text === 'string') {
    return data.text;
  }

  return '';
}

function parseGeminiAudio(data: any): { audioBase64: string | null; mimeType: string | null } {
  if (!data) {
    return { audioBase64: null, mimeType: null };
  }

  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (part?.mimeType?.startsWith('audio/')) {
        return {
          audioBase64: part?.data || null,
          mimeType: part?.mimeType || 'audio/ogg',
        };
      }
    }
  }

  return { audioBase64: null, mimeType: null };
}

async function performGeminiRequest({ cookies, payload, endpoint = GEMINI_CHAT_ENDPOINT }: GeminiRequestOptions) {
  assertRequiredCookies(cookies);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: buildHeaders(cookies),
    body: JSON.stringify(payload),
  });

  if (response.status === 401 || response.status === 403) {
    throw new CookieValidationError('Cookies expired or invalid. Please refresh them from gemini.google.com.');
  }

  if (response.status === 429) {
    throw new Error('Too many requests. Please try again later.');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function sendGeminiChatRequest({ cookies, message, conversationHistory }: GeminiChatRequest): Promise<GeminiChatResponse> {
  const payload = {
    contents: buildContents(conversationHistory, message),
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    },
  };

  const data = await performGeminiRequest({ cookies, payload, endpoint: GEMINI_CHAT_ENDPOINT });
  return {
    text: parseGeminiText(data),
    raw: data,
  };
}

export async function sendGeminiTTSRequest(cookies: string, text: string): Promise<GeminiTTSResponse> {
  const prompt = `Convert the following text into a natural sounding spoken response. Respond only with audio data.\n\n${text}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    responseModalities: ['AUDIO'],
    generationConfig: {
      temperature: 0.6,
      audioConfig: {
        voiceConfig: {
          gender: 'FEMALE',
          voice: 'en-US-Neural2-H',
        },
      },
    },
  };

  const data = await performGeminiRequest({ cookies, payload, endpoint: GEMINI_TTS_ENDPOINT });
  const { audioBase64, mimeType } = parseGeminiAudio(data);

  return {
    audioBase64,
    mimeType,
    raw: data,
  };
}

export async function validateGeminiCookies(cookies: string): Promise<{ valid: boolean; message?: string }> {
  try {
    await sendGeminiChatRequest({
      cookies,
      message: 'Ping',
      conversationHistory: [],
    });

    return { valid: true };
  } catch (error) {
    if (error instanceof CookieValidationError) {
      return { valid: false, message: error.message };
    }
    if (error instanceof Error) {
      return { valid: false, message: error.message };
    }
    return { valid: false, message: 'Failed to validate cookies. Please try again.' };
  }
}

export { CookieValidationError };
