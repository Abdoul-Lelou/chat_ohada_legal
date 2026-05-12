'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check, Scale, Sparkles } from 'lucide-react';
import { Message } from '@/store/useChatStore';
import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================================
   EMPTY STATE — Premium Welcome Screen
   ============================================================ */

const SUGGESTIONS = [
  "Quelles sont les conditions de création d'une SARL en droit OHADA ?",
  "Expliquez l'Acte Uniforme sur le droit commercial général.",
  "Quels sont les droits des actionnaires minoritaires ?",
  "Procédure de recouvrement des créances OHADA",
];

function EmptyState({ onSuggestionClick }: { onSuggestionClick?: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center text-center max-w-lg">
        {/* Logo */}
        <div className="relative mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-muted)] flex items-center justify-center border border-[var(--primary)]/20 shadow-lg">
            <Scale size={28} className="text-[var(--primary)]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center animate-pulse-ring">
            <Sparkles size={10} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 tracking-tight">
          Expert Juridique OHADA
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-10 max-w-sm">
          Posez vos questions sur le droit OHADA ou le droit guinéen. Je réponds à partir des textes officiels indexés dans la base.
        </p>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {SUGGESTIONS.map((text, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick?.(text)}
              className="text-left p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)]/30 transition-all duration-200 group cursor-pointer"
            >
              <p className="text-sm text-[var(--foreground)] leading-snug group-hover:text-[var(--primary)] transition-colors">
                {text}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MARKDOWN COMPONENTS — Premium Legal Rendering
   ============================================================ */

const MarkdownComponents = {
  h1: ({ children }: any) => (
    <h1>{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="flex items-center gap-2">
      <span className="text-[var(--primary)] text-sm">§</span>
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3>{children}</h3>
  ),
  blockquote: ({ children }: any) => (
    <blockquote>{children}</blockquote>
  ),
  table: ({ children }: any) => (
    <div className="legal-table-container">
      <table className="legal-table">{children}</table>
    </div>
  ),
  // Article Reference Highlighting
  p: ({ children }: any) => {
    if (typeof children === 'string') {
      const parts = children.split(/(Article\s+\d+(?:-\d+)?)/gi);
      if (parts.length > 1) {
        return (
          <p>
            {parts.map((part: string, i: number) =>
              part.match(/Article\s+\d+(?:-\d+)?/i)
                ? <span key={i} className="font-semibold text-[var(--accent-article)] bg-[var(--accent-article-bg)] px-1.5 py-0.5 rounded-md text-[0.875em]">{part}</span>
                : part
            )}
          </p>
        );
      }
    }
    return <p>{children}</p>;
  },
};

/* ============================================================
   USER BUBBLE — Compact, Right-Aligned
   ============================================================ */

const UserBubble = memo(({ message }: { message: Message }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    className="flex justify-end w-full"
  >
    <div className="max-w-[65%] flex items-start gap-3">
      <div
        className="px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed font-medium shadow-sm"
        style={{
          background: 'var(--user-bubble-bg)',
          color: 'var(--user-bubble-fg)',
          border: '1px solid var(--user-bubble-border)',
        }}
      >
        {message.content}
      </div>
    </div>
  </motion.div>
));
UserBubble.displayName = 'UserBubble';

/* ============================================================
   ASSISTANT CARD — Wide, Left-Aligned, Rich Markdown
   ============================================================ */

const AssistantCard = memo(({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex justify-start w-full"
    >
      <div className="flex items-start gap-3 max-w-full w-full">
        {/* Bot Avatar */}
        <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center shrink-0 mt-0.5 border border-[var(--primary)]/20">
          <Bot size={16} className="text-[var(--primary)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Markdown Body */}
          <div className="prose-legal">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents as any}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Sources Badges */}
          {(message as any).cited_sources && (message as any).cited_sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.15em]">
                Fondements Juridiques
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(message as any).cited_sources.map((source: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
                    style={{
                      background: 'var(--source-bg)',
                      border: '1px solid var(--source-border)',
                      color: 'var(--source-text)',
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--source-dot)' }} />
                    <span className="truncate max-w-[200px]">
                      {source.title || source.metadata?.title || 'Législation'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy Action */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md transition-all"
              style={{
                color: copied ? 'var(--primary)' : 'var(--copy-fg)',
                background: copied ? 'var(--primary-muted)' : 'var(--copy-bg)',
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = 'var(--copy-hover-fg)';
                  e.currentTarget.style.background = 'var(--copy-hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = 'var(--copy-fg)';
                  e.currentTarget.style.background = 'var(--copy-bg)';
                }
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
AssistantCard.displayName = 'AssistantCard';

/* ============================================================
   TYPING INDICATOR — Animated Dots
   ============================================================ */

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
          <Bot size={16} className="text-[var(--primary)]" />
        </div>
        <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-md bg-[var(--card)] border border-[var(--border)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-typing-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-typing-dot" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-typing-dot" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   CHAT ZONE — Main Container
   ============================================================ */

export default function ChatZone({
  messages,
  isLoading,
  onSuggestionClick,
}: {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick?: (text: string) => void;
}) {
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
      behavior: messages.length <= 2 ? 'auto' : 'smooth',
    });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <EmptyState onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth"
      >
        {/* Centered content column */}
        <div className="max-w-[var(--chat-max-width)] mx-auto px-4 sm:px-6 py-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message, idx) =>
              message.role === 'assistant' ? (
                <AssistantCard key={`msg-${message.id || idx}`} message={message} />
              ) : (
                <UserBubble key={`msg-${message.id || idx}`} message={message} />
              )
            )}
          </AnimatePresence>

          {isLoading && <TypingIndicator />}

          {/* Bottom spacer for scroll */}
          <div className="h-4 w-full shrink-0" />
        </div>
      </div>

      {/* Fade overlay at bottom */}
      {showFade && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}
