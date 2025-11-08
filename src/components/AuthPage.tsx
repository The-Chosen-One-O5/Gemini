import { useState } from 'react';
import { Eye, EyeOff, Key, AlertCircle, Check } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/lib/utils';

export function AuthPage() {
  const { setApiKey: setStoreApiKey, error } = useChatStore();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateApiKey = (key: string) => {
    if (!key.trim()) return false;
    
    // Basic validation for Google AI Studio API keys
    // They typically start with 'AIza' and are about 39 characters long
    return key.startsWith('AIza') && key.length >= 35;
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    
    if (value) {
      const valid = validateApiKey(value);
      setIsValid(valid);
    } else {
      setIsValid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      return;
    }

    setIsValidating(true);
    
    try {
      // Validate API key format
      if (!validateApiKey(apiKey)) {
        throw new Error('Invalid API key format. Please check your Google AI Studio API key.');
      }

      // Test the API key with a simple request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          message: 'Hello, this is a test message.',
          conversationHistory: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid API key');
      }

      // If successful, set the API key
      setStoreApiKey(apiKey);
    } catch (error) {
      console.error('API key validation failed:', error);
      // Error is already handled by the store
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Gemini Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your Google AI Studio API key to start chatting
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to get your API key:
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Google AI Studio</a></li>
              <li>Sign in with your Google account</li>
              <li>Click &quot;Create API Key&quot;</li>
              <li>Copy your API key (it starts with &quot;AIza&quot;)</li>
              <li>Paste it below</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Google AI Studio API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="AIza..."
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-lg border',
                    'bg-white dark:bg-gray-700',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    apiKey && (
                      isValid
                        ? 'border-green-300 dark:border-green-600'
                        : 'border-red-300 dark:border-red-600'
                    )
                  )}
                  disabled={isValidating}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showApiKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Validation indicator */}
              {apiKey && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {isValid ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">
                        Valid API key format
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400">
                        Invalid API key format
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!apiKey.trim() || !isValid || isValidating}
              className={cn(
                'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                apiKey && isValid && !isValidating
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
              )}
            >
              {isValidating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validating...
                </div>
              ) : (
                'Start Chatting'
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              🔒 Your API key is stored locally and never shared with third parties
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
