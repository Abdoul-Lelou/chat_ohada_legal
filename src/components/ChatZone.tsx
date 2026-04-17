'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from 'ai';
import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatZone({ messages, isLoading }: { messages: Message[], isLoading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowFade(!isAtBottom && scrollHeight > clientHeight);
  };

  useEffect(() => {
    handleScroll();
    scrollRef.current?.scrollTo({ 
      top: scrollRef.current.scrollHeight, 
      behavior: messages.length <= 2 ? 'auto' : 'smooth' 
    });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--muted-foreground)]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-6 shadow-sm border border-[var(--primary)]/20">
          <Bot size={32} className="text-[var(--primary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2 tracking-tight">Expert Juridique OHADA</h2>
        <p className="max-w-xs text-sm leading-relaxed">
          Posez vos questions sur le droit OHADA ou guinéen. Je réponds à partir des textes officiels indexés.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-10 hide-scrollbar scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((message, idx) => (
            <MessageBubble key={`chat-msg-${message.id || idx}`} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-5xl mx-auto justify-start"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div className="p-4 px-5 rounded-2xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] rounded-tl-none shadow-md flex items-center">
              <div className="flex gap-1.5 px-1">
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-duration:0.8s]"></span>
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.3s]"></span>
              </div>
            </div>
          </motion.div>
        )}
        <div className="h-10 w-full shrink-0" />
      </div>

      {showFade && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none z-10 animate-in fade-in duration-500" />
      )}
    </div>
  );
}

// 🧠 Specialized Legal Components for Markdown
const MarkdownComponents = {
  h1: ({ children }: any) => <h1 className="border-b border-[var(--status-warning)]/20 pb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="flex items-center gap-2"><span>§</span> {children}</h2>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-[var(--status-warning)] bg-[var(--status-warning)]/5 p-4 my-4 rounded-r-lg italic text-[var(--foreground)] shadow-sm">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="legal-table-container">
      <table className="legal-table">{children}</table>
    </div>
  ),
  // 📚 Article Reference Highlighting Logic
  p: ({ children }: any) => {
    if (typeof children === 'string') {
      const parts = children.split(/(Article \d+(?:-\d+)?)/gi);
      return (
        <p>
          {parts.map((part, i) => 
            part.match(/Article \d+(?:-\d+)?/i) 
              ? <span key={i} className="text-[var(--status-info)] font-bold px-1 rounded bg-[var(--status-info)]/10 ring-1 ring-[var(--status-info)]/20">{part}</span> 
              : part
          )}
        </p>
      );
    }
    return <p>{children}</p>;
  }
};

const MessageBubble = memo(({ message }: { message: Message }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`flex gap-4 group w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-[var(--status-assistant)] flex items-center justify-center shrink-0 shadow-lg mt-1 border border-white/10">
          <Bot size={22} className="text-white" />
        </div>
      )}
      
      <div className={`relative flex flex-col transition-all duration-300 ${
        isAssistant ? 'max-w-[92%] items-start' : 'max-w-[85%] items-end'
      }`}>
        {/* 🎉 Message Bubble */}
        <div className={`p-5 rounded-[var(--radius)] shadow-xl border transition-all duration-300 ${
          !isAssistant 
            ? 'bg-[var(--status-user)] text-white border-white/5 rounded-tr-none' 
            : 'bg-[var(--status-assistant)] text-white/95 border-emerald-400/20 rounded-tl-none ring-1 ring-emerald-500/20'
        }`}>
          <div className={`max-w-none ${isAssistant ? 'prose-legal' : 'text-sm font-medium leading-relaxed'}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents as any}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* 📚 Sources Badges */}
          {isAssistant && (message as any).cited_sources && (message as any).cited_sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Fondements Juridiques</span>
              <div className="flex flex-wrap gap-2">
                {(message as any).cited_sources.map((source: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 text-emerald-300 text-[11px] font-medium shadow-sm hover:bg-black/30 transition-all cursor-default"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="truncate max-w-[180px]">{source.title || (source.metadata?.title) || "Législation"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🛠️ Action Tools (Copy) */}
        {isAssistant && (
          <button 
            onClick={handleCopy}
            className="mt-2 text-white/40 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        )}
      </div>

      {!isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center shrink-0 shadow-lg mt-1 border border-white/5">
          <User size={20} className="text-white/80" />
        </div>
      )}
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';
