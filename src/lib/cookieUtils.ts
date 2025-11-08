import CryptoJS from 'crypto-js';

const DEFAULT_SECRET = 'gemini-chat-cookie-secret';

const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_COOKIE_ENCRYPTION_SECRET || DEFAULT_SECRET;

export const COOKIE_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 12; // 12 hours

export function sanitizeCookieString(cookieString: string): string {
  return cookieString
    .replace(/\s*\n\s*/g, '; ')
    .replace(/\s{2,}/g, ' ')
    .replace(/;{2,}/g, ';')
    .trim()
    .replace(/^;+|;+$/g, '')
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('; ');
}

export function parseCookieString(cookieString: string): Record<string, string> {
  return sanitizeCookieString(cookieString)
    .split(';')
    .reduce<Record<string, string>>((acc, segment) => {
      const [rawKey, ...rawValue] = segment.split('=');
      const key = rawKey?.trim();
      if (!key) {
        return acc;
      }
      const value = rawValue.join('=').trim();
      acc[key] = value;
      return acc;
    }, {});
}

export function getCookieValue(cookieString: string, name: string): string | null {
  const parsed = parseCookieString(cookieString);
  return parsed[name] ?? null;
}

export function hasRequiredCookieTokens(cookieString: string): boolean {
  const cleaned = sanitizeCookieString(cookieString);
  const tokens = ['__Secure-1PSID', '__Secure-1PSIDTS'];
  return tokens.every((token) => cleaned.includes(`${token}=`));
}

export function encryptCookieString(cookieString: string): string {
  return CryptoJS.AES.encrypt(cookieString, ENCRYPTION_SECRET).toString();
}

export function decryptCookieString(encrypted: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_SECRET);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    return decoded || '';
  } catch {
    return '';
  }
}

export function areCookiesStale(timestampIso: string | null, thresholdMs = COOKIE_REFRESH_THRESHOLD_MS): boolean {
  if (!timestampIso) return true;
  const timestamp = new Date(timestampIso).getTime();
  if (Number.isNaN(timestamp)) {
    return true;
  }
  return Date.now() - timestamp > thresholdMs;
}
