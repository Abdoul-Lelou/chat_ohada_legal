'use client';

import { useEffect, useState, memo } from 'react';
import { 
  Plus, MessageSquare, Trash2, LogOut, BookOpen, 
  Link, Sun, Moon, PanelLeftClose, PanelLeftOpen, X, Database
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { useChatStore } from '@/store/useChatStore';
import UploadModal from './UploadModal';
import DocumentIndexModal from './DocumentIndexModal';

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
  
  // 🧠 UI & Data from Zustand Store
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
    const res = await fetch('/api/documents');
    if (res.ok) {
      const data = await res.json();
      // 🛡️ Sanitize: Filter out items without IDs to avoid duplicate key errors
      const validDocs = (data || []).filter((doc: DocumentItem) => doc && doc.id);
      setDocuments(validDocs);
    }
  };

  const deleteDocument = async (id: string) => {
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return toast.error("Erreur lors de la suppression");
    toast.success("Document supprimé");
    setDocuments(documents.filter(d => d.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    setMounted(true);
    fetchDocuments();
  }, []);

  if (!mounted) return null; // 🛡️ Prevent hydration loop/mismatch

  return (
    <>
      {/* 📱 Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-300"
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
        {/* Toggle Collapse Button (Desktop) */}
        <button 
          onClick={() => setCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-[var(--card)] border border-[var(--border)] rounded-full p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)] shadow-sm z-40 transition-colors hidden md:block"
          title={isCollapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>

        {/* Close Button (Mobile) */}
        <button 
          onClick={toggleMobile}
          className="md:hidden absolute right-4 top-4 p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-3 space-y-2 shrink-0 mt-12 md:mt-0">
          <button
            onClick={() => {
              createConversation();
              toast.success("Nouvelle discussion prête");
            }}
            className={`w-full flex items-center gap-2 p-2.5 text-sm font-medium border border-[var(--border)] bg-[var(--background)] rounded-lg hover:bg-[var(--secondary)] transition-all ${
              isCollapsed ? 'md:justify-center' : 'justify-start md:justify-start'
            }`}
          >
            <Plus size={18} className="text-[var(--primary)] shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Nouveau Chat</span>}
          </button>
          
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={`w-full flex items-center gap-2 p-2.5 text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/20 border border-[var(--primary)]/20 transition-all ${
              isCollapsed ? 'md:justify-center' : 'justify-start md:justify-start'
            }`}
          >
            <BookOpen size={18} className="shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Document RAG</span>}
          </button>

          <button
            onClick={() => setIsIndexModalOpen(true)}
            className={`w-full flex items-center gap-2 p-2.5 text-sm font-medium border border-[var(--border)] bg-[var(--background)] rounded-lg hover:bg-[var(--secondary)] transition-all ${
              isCollapsed ? 'md:justify-center' : 'justify-start md:justify-start'
            }`}
          >
            <Database size={18} className="text-[var(--primary)] shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Index des documents</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 hide-scrollbar flex flex-col gap-4 py-2">
          
          {/* Documents Section */}
          {/* {(!isCollapsed || isMobileOpen) && documents.length > 0 && (
            <div className="px-2">
              <h3 className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2 px-1">Index</h3>
              <div className="space-y-0.5">
                {documents.map((doc, idx) => (
                  <DocumentRow key={doc.id || `doc-${idx}`} doc={doc} onDelete={deleteDocument} />
                ))}
              </div>
            </div>
          )} */}

          {/* {(!isCollapsed || isMobileOpen) && documents.length > 0 && <div className="border-t border-[var(--border)] mx-2 my-1" />} */}

          {/* Conversations Section */}
          <div className={`${isCollapsed && !isMobileOpen ? 'px-1' : 'px-2'} space-y-1 mb-4`}>
            {(!isCollapsed || isMobileOpen) && conversations.length > 0 && <h3 className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest pl-1 mb-2">Discussions</h3>}
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

        <div className="p-3 border-t border-[var(--border)] shrink-0 space-y-1">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={`flex items-center gap-3 w-full p-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--secondary)] transition-all ${
              isCollapsed && !isMobileOpen ? 'md:justify-center' : 'justify-start md:justify-start'
            }`}
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Mode {resolvedTheme === 'dark' ? 'Clair' : 'Sombre'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full p-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--destructive)] rounded-lg hover:bg-[var(--secondary)] transition-all ${
              isCollapsed && !isMobileOpen ? 'md:justify-center' : 'justify-start md:justify-start'
            }`}
          >
            <LogOut size={18} />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Déconnexion</span>}
          </button>
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

// Optimized Sub-components with Memo
const DocumentRow = memo(({ doc, onDelete }: { doc: { id: string; title: string }, onDelete: (id: string) => void }) => (
  <div className="group flex items-center justify-between p-1.5 rounded-md text-xs transition hover:bg-[var(--secondary)]">
    <div className="flex items-center gap-2 overflow-hidden w-full">
      <Link size={14} className="text-[var(--primary)] shrink-0" />
      <span className="truncate text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" title={doc.title}>{doc.title}</span>
    </div>
    <button
      onClick={() => onDelete(doc.id)}
      className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--destructive)] text-[var(--muted-foreground)] shrink-0 transition-opacity"
      aria-label="Supprimer le document"
    >
      <Trash2 size={12} />
    </button>
  </div>
));
DocumentRow.displayName = 'DocumentRow';

const ConversationRow = memo(({ 
  conv, isActive, isCollapsed, onSelect, onDelete 
}: { 
  conv: { id: string; title: string }, 
  isActive: boolean, 
  isCollapsed: boolean,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void
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
    className={`group flex items-center justify-between cursor-pointer rounded-lg text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
      isCollapsed ? 'p-2.5 justify-center' : 'p-2.5 gap-3'
    } ${
      isActive 
        ? 'bg-[var(--primary)]/10 text-[var(--primary)] ring-1 ring-[var(--primary)]/30' 
        : 'hover:bg-[var(--secondary)] text-[var(--muted-foreground)]'
    }`}
    title={isCollapsed ? conv.title : undefined}
  >
    <div className="flex items-center gap-3 overflow-hidden">
      <MessageSquare size={18} className={isActive ? 'text-[var(--primary)]' : ''} />
      {!isCollapsed && <span className="truncate font-medium">{conv.title}</span>}
    </div>
    {!isCollapsed && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conv.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--destructive)] transition-opacity focus:opacity-100 outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded"
        aria-label={`Supprimer la conversation: ${conv.title}`}
      >
        <Trash2 size={14} />
      </button>
    )}
  </div>
));
ConversationRow.displayName = 'ConversationRow';
