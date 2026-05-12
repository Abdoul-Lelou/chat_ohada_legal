'use client';

import { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const resetHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = '52px';
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = (input || '').trim();
      if (trimmed && !isLoading) {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
        resetHeight();
      }
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    e.target.style.height = '52px';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const canSend = (input || '').trim() && !isLoading;

  return (
    <div className="shrink-0 relative z-20 bg-[var(--background)]">
      {/* Fade gradient above input */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />

      <div className="max-w-[var(--chat-max-width)] mx-auto px-4 sm:px-6 pb-4 pt-2">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg transition-all duration-200 focus-within:border-[var(--primary)]/40 focus-within:shadow-[0_0_0_3px_var(--primary-muted)]"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Posez votre question juridique..."
            className="flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] pl-4 pr-14 py-3.5 min-h-[52px] max-h-[160px] focus:outline-none resize-none hide-scrollbar text-[0.9375rem] leading-relaxed"
            rows={1}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!canSend}
            className={`absolute right-2 bottom-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              canSend
                ? 'bg-[var(--primary)] text-white shadow-md hover:brightness-110 active:scale-95 cursor-pointer'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
            aria-label="Envoyer le message"
            onClick={resetHeight}
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </form>

        <p className="text-center text-[10px] text-[var(--muted-foreground)] mt-2.5 font-medium tracking-wide opacity-60">
          L&apos;IA peut faire des erreurs · Vérifiez les textes officiels
        </p>
      </div>
    </div>
  );
}
