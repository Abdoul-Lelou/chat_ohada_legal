'use client';

import { useState, useEffect } from 'react';
import { Bot, AlertCircle, Menu } from 'lucide-react';
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
  
  // 🧠 State from Zustand Store (Selectors for performance)
  const activeId = useChatStore((state) => state.activeId);
  const messages = useChatStore((state) => (activeId ? state.messages[activeId] : null) || EMPTY_MESSAGES);
  const isStreaming = useChatStore((state) => state.isStreaming);
  
  const addMessage = useChatStore((state) => state.addMessage);
  const createConversation = useChatStore((state) => state.createConversation);
  const toggleMobileSidebar = useChatStore((state) => state.toggleMobileSidebar);

  // 🛡️ Safe Hydration for Next.js
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

    // 1. 🧠 Smart Auto-Creation
    if (!targetConvId) {
      // 🛂 Get user from Supabase for metadata consistency
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const generatedTitle = chatUtils.generateAutoTitle(userMessageContent);
      targetConvId = createConversation(generatedTitle, user?.id);
    }

    // 2. Add User Message to Store
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userMessageContent,
    };
    
    addMessage(targetConvId, userMessage);
    setInput('');

    // 3. 🚀 Trigger AI Response via Service Layer
    const updatedMessages = [...messages, userMessage];
    await chatService.sendMessage(targetConvId, updatedMessages);
  };

  if (!mounted) {
    return (
      <div className="flex h-screen bg-[var(--background)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center animate-pulse">
            <Bot size={24} className="text-[var(--primary)]" />
          </div>
          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest animate-pulse">Chargement OHADA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans transition-colors duration-300">
      <Sidebar />
      
      <main className="flex-1 flex flex-col relative w-full h-full bg-[var(--background)] min-w-0">
        {/* Mobile Header (SaaS Polish) */}
        <div className="md:hidden flex items-center justify-between p-3 bg-[var(--card)] border-b border-[var(--border)] shrink-0 shadow-sm z-50 transition-colors">
          <button 
            onClick={toggleMobileSidebar}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          
          <h1 className="text-base font-bold text-[var(--primary)] uppercase tracking-tight">OHADA Legal</h1>
          
          <div className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center">
            <Bot size={18} className="text-[var(--primary)]" />
          </div>
        </div>

        {/* 🟡 Unsaved Session Banner */}
        {!activeId && messages.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-medium rounded-full shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={14} className="text-[var(--primary)]" />
            <span>Nouvelle session · L'historique sera créé à l'envoi du message</span>
          </div>
        )}

        <ChatZone messages={messages} isLoading={isStreaming} />
        
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
