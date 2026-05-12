'use client';

import { useEffect, useState, memo } from 'react';
import {
  Plus, MessageSquare, Trash2, LogOut, BookOpen,
  Sun, Moon, PanelLeftClose, PanelLeftOpen, X, Database, Scale,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { useChatStore } from '@/store/useChatStore';
import UploadModal from './UploadModal';
import DocumentIndexModal from './DocumentIndexModal';
import { parseApiError, handleUknownError } from '@/lib/error-parser';

type DocumentItem = {
  id: string;
  title: string;
  source_type: string;
};

export default function Sidebar() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isIndexModalOpen, setIsIndexModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const conversations = useChatStore((state) => state.conversations);
  const activeId = useChatStore((state) => state.activeId);
  const isCollapsed = useChatStore((state) => state.isSidebarCollapsed);
  const isMobileOpen = useChatStore((state) => state.isMobileSidebarOpen);

  const selectConversation = useChatStore((state) => state.selectConversation);
  const createConversation = useChatStore((state) => state.createConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const setCollapsed = useChatStore((state) => state.setSidebarCollapsed);
  const toggleMobile = useChatStore((state) => state.toggleMobileSidebar);

  const { setTheme, resolvedTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        const validDocs = (data || []).filter((doc: DocumentItem) => doc && doc.id);
        setDocuments(validDocs);
      } else {
        // Silently fail for sidebar listing to not annoy user, or log internally
        const friendly = await parseApiError(res);
        console.warn('[SIDEBAR_DOCS_FETCH_FAIL]', friendly.message);
      }
    } catch (err) {
      const friendly = handleUknownError(err);
      console.warn('[SIDEBAR_DOCS_FETCH_ERROR]', friendly.message);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Document supprimé");
        setDocuments(documents.filter(d => d.id !== id));
      } else {
        const friendly = await parseApiError(res);
        toast.error(friendly.message);
      }
    } catch (err) {
      const friendly = handleUknownError(err);
      toast.error(friendly.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    setMounted(true);
    fetchDocuments();
  }, []);

  if (!mounted) return null;

  const showLabels = !isCollapsed || isMobileOpen;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={toggleMobile}
        />
      )}

      <aside
        className={`bg-[var(--card)] text-[var(--foreground)] h-screen flex flex-col fixed inset-y-0 left-0 z-[70] md:relative md:flex border-r border-[var(--border)] transition-all duration-[var(--transition-speed)] ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed ? 'md:w-[var(--sidebar-collapsed)]' : 'md:w-[var(--sidebar-width)] w-[280px]'
        }`}
        aria-expanded={!isCollapsed}
      >
        {/* ── Collapse Toggle (Desktop) ── */}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-[var(--card)] border border-[var(--border)] rounded-full p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] shadow-sm z-40 transition-colors hidden md:flex items-center justify-center"
          title={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
        >
          {isCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        {/* ── Mobile Close ── */}
        <button
          onClick={toggleMobile}
          className="md:hidden absolute right-3 top-3 p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
        >
          <X size={18} />
        </button>

        {/* ── Header / Brand ── */}
        <div className={`p-4 shrink-0 mt-10 md:mt-0 ${isCollapsed && !isMobileOpen ? 'px-2' : ''}`}>
          {/* Brand */}
          <div className={`flex items-center gap-2.5 mb-5 ${isCollapsed && !isMobileOpen ? 'justify-center' : 'px-1'}`}>
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
              <Scale size={16} className="text-[var(--primary)]" />
            </div>
            {showLabels && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--foreground)] tracking-tight leading-none">OHADA</span>
                <span className="text-[10px] text-[var(--muted-foreground)] font-medium tracking-wide">Legal AI</span>
              </div>
            )}
          </div>

          {/* ── New Chat Button ── */}
          <button
            onClick={() => {
              createConversation();
              toast.success('Nouvelle discussion prête');
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl bg-[var(--primary)] text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-sm ${
              isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''
            }`}
          >
            <Plus size={16} className="shrink-0" />
            {showLabels && <span>Nouveau Chat</span>}
          </button>
        </div>

        {/* ── Document Actions ── */}
        <div className={`px-4 pb-3 space-y-1 shrink-0 ${isCollapsed && !isMobileOpen ? 'px-2' : ''}`}>
          <SidebarButton
            icon={<BookOpen size={16} />}
            label="Document RAG"
            showLabel={showLabels}
            onClick={() => setIsUploadModalOpen(true)}
          />
          <SidebarButton
            icon={<Database size={16} />}
            label="Index documents"
            showLabel={showLabels}
            onClick={() => setIsIndexModalOpen(true)}
          />
        </div>

        {/* ── Conversations List ── */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-2 py-1">
          {showLabels && conversations.length > 0 && (
            <h3 className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.12em] px-3 mb-2 mt-1">
              Discussions
            </h3>
          )}
          <div className="space-y-0.5">
            {conversations.map((conv, idx) => (
              <ConversationRow
                key={`sidebar-conv-${conv.id || idx}`}
                conv={conv}
                isActive={activeId === conv.id}
                isCollapsed={isCollapsed && !isMobileOpen}
                onSelect={selectConversation}
                onDelete={deleteConversation}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={`p-3 border-t border-[var(--border)] shrink-0 space-y-0.5 ${isCollapsed && !isMobileOpen ? 'px-2' : ''}`}>
          <SidebarButton
            icon={resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            label={`Mode ${resolvedTheme === 'dark' ? 'Clair' : 'Sombre'}`}
            showLabel={showLabels}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          />
          <SidebarButton
            icon={<LogOut size={16} />}
            label="Déconnexion"
            showLabel={showLabels}
            onClick={handleLogout}
            variant="danger"
          />
        </div>
      </aside>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchDocuments()}
      />

      <DocumentIndexModal
        isOpen={isIndexModalOpen}
        onClose={() => setIsIndexModalOpen(false)}
        onRefreshNeeded={() => fetchDocuments()}
      />
    </>
  );
}

/* ============================================================
   SIDEBAR BUTTON — Reusable
   ============================================================ */

function SidebarButton({
  icon,
  label,
  showLabel,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  showLabel: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all ${
        !showLabel ? 'justify-center px-0' : ''
      } ${
        variant === 'danger'
          ? 'text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-muted)]'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
      }`}
      title={!showLabel ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {showLabel && <span className="truncate">{label}</span>}
    </button>
  );
}

/* ============================================================
   CONVERSATION ROW — Memoized
   ============================================================ */

const ConversationRow = memo(({
  conv, isActive, isCollapsed, onSelect, onDelete,
}: {
  conv: { id: string; title: string };
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <div
    onClick={() => onSelect(conv.id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(conv.id);
      }
    }}
    tabIndex={0}
    role="button"
    aria-pressed={isActive}
    className={`group flex items-center justify-between cursor-pointer rounded-lg text-sm transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
      isCollapsed ? 'p-2 justify-center' : 'px-3 py-2 gap-2'
    } ${
      isActive
        ? 'bg-[var(--primary-muted)] text-[var(--primary)] font-medium'
        : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
    }`}
    title={isCollapsed ? conv.title : undefined}
  >
    <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
      <MessageSquare size={15} className="shrink-0" />
      {!isCollapsed && <span className="truncate text-[13px]">{conv.title}</span>}
    </div>
    {!isCollapsed && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conv.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--destructive)] transition-all rounded focus:opacity-100 outline-none focus-visible:ring-1 focus-visible:ring-red-500 shrink-0"
        aria-label={`Supprimer: ${conv.title}`}
      >
        <Trash2 size={13} />
      </button>
    )}
  </div>
));
ConversationRow.displayName = 'ConversationRow';
