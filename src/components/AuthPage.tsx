import { useMemo, useState } from 'react';
import {
  Cookie as CookieIcon,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  RefreshCcw,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { cn, formatFullDate } from '@/lib/utils';
import {
  hasRequiredCookieTokens,
  sanitizeCookieString,
  COOKIE_REFRESH_THRESHOLD_MS,
} from '@/lib/cookieUtils';

const STEPS = [
  'Go to gemini.google.com and sign in',
  'Press F12 to open DevTools',
  'Open the "Application" tab',
  'Expand "Cookies" in the left sidebar',
  'Select gemini.google.com',
  'Copy all cookie rows (press Ctrl/Cmd+C)',
  'Paste the cookie text below',
];

const statusConfig = {
  valid: {
    icon: CheckCircle2,
    label: 'Authenticated',
    className: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/30',
  },
  invalid: {
    icon: AlertCircle,
    label: 'Not authenticated',
    className: 'text-rose-500 bg-rose-500/10 border border-rose-500/30',
  },
  expired: {
    icon: RefreshCcw,
    label: 'Refresh needed',
    className: 'text-amber-500 bg-amber-500/10 border border-amber-500/30',
  },
  unknown: {
    icon: ClipboardPaste,
    label: 'Awaiting cookies',
    className: 'text-sky-500 bg-sky-500/10 border border-sky-500/30',
  },
  null: {
    icon: ClipboardPaste,
    label: 'Awaiting cookies',
    className: 'text-sky-500 bg-sky-500/10 border border-sky-500/30',
  },
} as const;

function getStatusKey(status: keyof typeof statusConfig | null) {
  if (!status) return 'null';
  return status;
}

export function AuthPage() {
  const {
    setCookies,
    logout,
    cookieStatus,
    cookiesSetAt,
    lastValidatedAt,
    shouldRefreshCookies,
    setCookieStatus,
  } = useChatStore();

  const [cookieInput, setCookieInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<'success' | 'error' | null>(null);

  const currentStatus = useMemo(() => {
    const statusKey = getStatusKey(cookieStatus as keyof typeof statusConfig | null);
    return statusConfig[statusKey as keyof typeof statusConfig];
  }, [cookieStatus]);

  const shouldPromptRefresh = cookieStatus === 'valid' && shouldRefreshCookies();

  const lastUpdatedLabel = useMemo(() => {
    const reference = lastValidatedAt || cookiesSetAt;
    if (!reference) return null;
    return formatFullDate(new Date(reference));
  }, [cookiesSetAt, lastValidatedAt]);

  const handleCookieChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCookieInput(event.target.value);
    if (validationMessage) {
      setValidationMessage(null);
      setValidationState(null);
    }
  };

  const handleValidate = async (event: React.FormEvent) => {
    event.preventDefault();

    const rawCookies = cookieInput.trim();

    if (!rawCookies) {
      setValidationMessage('Paste your Gemini cookies before continuing.');
      setValidationState('error');
      return;
    }

    if (!hasRequiredCookieTokens(rawCookies)) {
      setValidationMessage('Please paste valid Gemini cookies from gemini.google.com. Cookies should include PSID, NID, or __Secure-* tokens.');
      setValidationState('error');
      return;
    }

    const sanitized = sanitizeCookieString(rawCookies);

    setIsValidating(true);
    setValidationMessage(null);
    setValidationState(null);

    let validated = false;

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies: sanitized }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.valid) {
        const errorMessage =
          data?.message ||
          (response.status === 401
            ? 'Cookies expired or invalid. Please refresh them from gemini.google.com.'
            : 'Failed to validate cookies. Please try again.');

        setCookieStatus('invalid');
        setValidationMessage(errorMessage);
        setValidationState('error');
        return;
      }

      setCookies(sanitized, { validated: true });
      setValidationMessage('Cookies saved securely. Redirecting to chat...');
      setValidationState('success');
      validated = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate cookies. Please try again.';
      setValidationMessage(message);
      setValidationState('error');
    } finally {
      setIsValidating(false);
      if (validated) {
        setCookieInput('');
      }
    }
  };

  const handleClear = () => {
    logout();
    setCookieStatus('unknown');
    setCookieInput('');
    setValidationMessage(null);
    setValidationState(null);
  };

  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-[#0f1729] text-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center gap-4 justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <CookieIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Gemini Chat</h1>
            <p className="text-gray-400 mt-2">
              Authenticate with your Gemini session cookies to start chatting securely.
            </p>
          </div>
        </div>

        <div className="bg-[#1a1f2d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Status</p>
              <div
                className={cn(
                  'mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium',
                  currentStatus.className
                )}
              >
                <StatusIcon className="w-4 h-4" />
                <span>{currentStatus.label}</span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 text-sm text-gray-400">
              {lastUpdatedLabel ? (
                <span>
                  Last verified:&nbsp;
                  <strong className="text-gray-200">{lastUpdatedLabel}</strong>
                </span>
              ) : (
                <span>Waiting for authentication…</span>
              )}
              <span>Cookies never leave your browser. They are encrypted with AES locally.</span>
            </div>
          </div>

          {shouldPromptRefresh && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-200 px-6 py-3 flex items-center gap-3">
              <RefreshCcw className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                Your cookies look older than {Math.round(COOKIE_REFRESH_THRESHOLD_MS / (1000 * 60 * 60))} hours. Grab a fresh copy from gemini.google.com to avoid interruptions.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2">
            <div className="p-6 border-b md:border-b-0 md:border-r border-white/10 bg-[#141927]">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Secure Instructions
              </h2>
              <ol className="space-y-3 text-sm text-gray-300 list-decimal list-inside">
                {STEPS.map((step, index) => (
                  <li key={index} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-sm text-blue-100">
                <strong>Tip:</strong> Select all cookie rows in DevTools and copy them at once. Avoid copying headers or extra text.
              </div>
            </div>

            <form onSubmit={handleValidate} className="p-6 flex flex-col gap-4">
              <div>
                <label htmlFor="cookies" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  Paste Gemini cookies
                  <span className="text-xs text-gray-500">(Securely encrypted in your browser)</span>
                </label>
                <textarea
                  id="cookies"
                  value={cookieInput}
                  onChange={handleCookieChange}
                  placeholder="Paste all cookies from gemini.google.com (from DevTools → Application → Cookies)"
                  className="mt-2 w-full min-h-[200px] resize-none rounded-2xl border border-white/10 bg-[#0f1421] text-gray-100 placeholder:text-gray-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                  spellCheck={false}
                  disabled={isValidating}
                />
              </div>

              {validationMessage && (
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
                    validationState === 'success'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-100'
                  )}
                >
                  {validationState === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p>{validationMessage}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={!cookieInput.trim() || isValidating}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition-all duration-200',
                    'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#1a1f2d]',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isValidating ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Validating…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Continue
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Clear cookies
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-xs text-center text-gray-500 max-w-2xl mx-auto">
          Gemini cookies are encrypted in localStorage using AES-256. They are never sent to any third-party service—only proxied directly to Gemini through this application. For best security, refresh your cookies regularly and avoid sharing them with anyone.
        </p>
      </div>
    </div>
  );
}
