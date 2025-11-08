import { useState } from 'react';
import { Menu, X, LogOut, Bot, AlertTriangle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { ThemeToggle } from './ThemeToggle';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { logout, cookieStatus, shouldRefreshCookies } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const needsCookieRefresh =
    cookieStatus === 'expired' || (cookieStatus === 'valid' && shouldRefreshCookies());

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-80 transform transition-transform duration-200 ease-in-out lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#ffffff] dark:bg-[#2d2d2d] border-b border-[#e5e7eb] dark:border-[#3f3f46] px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between xl:justify-start xl:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl xl:hidden bg-[#f5f5f5] dark:bg-[#1f1f1f] hover:bg-[#ebebeb] dark:hover:bg-[#272727] transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Gemini Chat</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Private, cookie-authenticated Gemini conversations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {needsCookieRefresh && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Refresh Gemini cookies</span>
                </div>
              )}
              <ThemeToggle className="bg-[#f5f5f5] dark:bg-[#1f1f1f]" />
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-[#0f172a] dark:bg-[#3b82f6] text-white hover:bg-[#1d2a44] dark:hover:bg-[#2563eb] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-[#ffffff] dark:bg-[#20212a]">
          {children}
        </main>
      </div>
    </div>
  );
}
