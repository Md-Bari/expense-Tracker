'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import FloatingChatbot from '@/components/FloatingChatbot';

function FloatingChatbotWrapper() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <FloatingChatbot />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale time
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          {children}
          <FloatingChatbotWrapper />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
