'use client';

import { useState, useEffect } from 'react';
import { Scale, Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChatZone from '@/components/ChatZone';
import ChatInput from '@/components/ChatInput';
import { useChatStore } from '@/store/useChatStore';
import { chatService } from '@/services/chatService';
import { chatUtils } from '@/lib/chat-utils';

const EMPTY_MESSAGES: any[] = [];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);

  // State from Zustand Store
  const activeId = useChatStore((state) => state.activeId);
  const messages = useChatStore((state) => (activeId ? state.messages[activeId] : null) || EMPTY_MESSAGES);
  const isStreaming = useChatStore((state) => state.isStreaming);

  const addMessage = useChatStore((state) => state.addMessage);
  const createConversation = useChatStore((state) => state.createConversation);
  const toggleMobileSidebar = useChatStore((state) => state.toggleMobileSidebar);

  // Safe Hydration
  useEffect(() => {
    const init = async () => {
      // @ts-ignore
      await useChatStore.persist.rehydrate();
      setMounted(true);
    };
    init();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setInput(e.target.value);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    let targetConvId = activeId;
    const userMessageContent = input.trim();

    // Auto-create conversation if none active
    if (!targetConvId) {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const generatedTitle = chatUtils.generateAutoTitle(userMessageContent);
      targetConvId = createConversation(generatedTitle, user?.id);
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userMessageContent,
    };

    addMessage(targetConvId, userMessage);
    setInput('');

    const updatedMessages = [...messages, userMessage];
    await chatService.sendMessage(targetConvId, updatedMessages);
  };

  // Handle suggestion click from empty state
  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  if (!mounted) {
    return (
      <div className="flex h-screen bg-[var(--background)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-muted)] flex items-center justify-center animate-pulse">
            <Scale size={24} className="text-[var(--primary)]" />
          </div>
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest animate-pulse">
            Chargement...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col relative w-full h-full min-w-0">
        {/* ── Mobile Header ── */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] shrink-0 z-50">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 -ml-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <Scale size={16} className="text-[var(--primary)]" />
            <span className="text-sm font-bold text-[var(--foreground)] tracking-tight">OHADA Legal</span>
          </div>

          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* ── Chat Messages ── */}
        <ChatZone
          messages={messages}
          isLoading={isStreaming}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* ── Chat Input ── */}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isStreaming}
        />
      </main>
    </div>
  );
}
