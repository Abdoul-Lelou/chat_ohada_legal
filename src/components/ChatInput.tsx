import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ 
  input,
  handleInputChange,
  handleSubmit,
  isLoading 
}: {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus behavior
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = (input || '').trim();
      if (trimmed && !isLoading) {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
        if (textareaRef.current) textareaRef.current.style.height = '48px';
      }
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    e.target.style.height = '48px'; 
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="w-full bg-[var(--background)] p-4 pt-1 border-t border-[var(--border)] shrink-0 relative z-20">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Questions juridiques ? (ex: Conditions de création d'une SARL...)"
          className="w-full bg-[var(--card)] text-[var(--foreground)] rounded-xl pl-4 pr-12 py-3 min-h-[48px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border border-[var(--border)] resize-none flex-1 hide-scrollbar custom-scrollbar transition-all shadow-sm disabled:opacity-50 text-[13.5px]"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!(input || '').trim() || isLoading}
          className={`absolute right-2 p-2 rounded-lg transition-all duration-200 ${
            (input || '').trim() && !isLoading 
              ? 'bg-[var(--primary)] text-white shadow-md hover:scale-105 active:scale-95' 
              : 'bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed'
          }`}
          aria-label="Envoyer le message"
          onClick={() => {
            if (textareaRef.current) textareaRef.current.style.height = '48px';
          }}
        >
          <Send size={18} />
        </button>
      </form>
      <div className="text-center text-[10px] text-[var(--muted-foreground)] mt-2 font-medium tracking-wide uppercase opacity-70">
        L'IA peut faire des erreurs. Vérifiez les textes officiels cités.
      </div>
    </div>
  );
}
