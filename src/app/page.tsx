'use client';

import { Layout } from '@/components/Layout';
import { AuthPage } from '@/components/AuthPage';
import { ChatWindow } from '@/components/ChatWindow';
import { useChatStore } from '@/stores/chatStore';

export default function Home() {
  const { isAuthenticated } = useChatStore();

  if (!isAuthenticated) {
    return (
      <Layout>
        <AuthPage />
      </Layout>
    );
  }

  return (
    <Layout>
      <ChatWindow />
    </Layout>
  );
}
