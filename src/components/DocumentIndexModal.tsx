'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, FileText, Trash2, Plus, 
  Calendar, Tag, Activity, Database
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';
import UploadModal from './UploadModal';

interface Document {
  id: string;
  title: string;
  source_type: string;
  status: string;
  created_at: string;
}

interface DocumentIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshNeeded?: () => void;
}

export default function DocumentIndexModal({
  isOpen,
  onClose,
  onRefreshNeeded
}: DocumentIndexModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        // 🛡️ Sanitize: Filter out any items without a valid ID to prevent duplicate key errors
        const validDocs = (data || []).filter((doc: Document) => doc && doc.id);
        setDocuments(validDocs);
      }
    } catch (err) {
      toast.error("Impossible de charger l'index");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Document supprimé définitivement");
        setDocuments(documents.filter(d => d.id !== id));
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        toast.error("Échec de la suppression");
      }
    } catch (err) {
      toast.error("Erreur serveur lors de la suppression");
    }
  };

  useEffect(() => {
    if (isOpen) fetchDocuments();
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div 
            key="document-index-modal-root"
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-3xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
                  <Database size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Index des Documents</h2>
                  <p className="text-xs text-[var(--muted-foreground)] font-medium">Gestion des sources juridiques pour le RAG</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all active:scale-95"
                >
                  <Plus size={18} />
                  Ajouter
                </button> */}
                <button 
                  onClick={onClose}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto p-6 md:px-8 hide-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">Chargement de l'index...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="p-6 bg-[var(--secondary)] rounded-full text-[var(--muted-foreground)] opacity-50">
                    <FileText size={48} />
                  </div>
                  <div className="max-w-xs">
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Aucun document indexé</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Commencez par ajouter des Actes Uniformes ou des Codes pour alimenter l'IA.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {/* Custom Table Header (Mobile Friendly) */}
                  <div className="hidden md:grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest border-b border-[var(--border)] mb-2">
                    <div className="col-span-6 flex items-center gap-2 px-1"><FileText size={12} /> Titre</div>
                    <div className="col-span-2 flex items-center gap-2 px-1"><Tag size={12} /> Catégorie</div>
                    <div className="col-span-2 flex items-center gap-2 px-1"><Activity size={12} /> État</div>
                    <div className="col-span-2 flex items-center gap-2 px-1"><Calendar size={12} /> Date</div>
                  </div>

                  {/* Document Rows */}
                  {documents.map((doc, idx) => (
                    <div 
                      key={`index-doc-${doc.id || idx}`}
                      className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 md:px-4 md:py-3 bg-[var(--background)]/40 hover:bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)]/30 rounded-2xl transition-all group"
                    >
                      <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/5 text-[var(--primary)] flex items-center justify-center shrink-0 border border-[var(--primary)]/10">
                          <FileText size={18} />
                        </div>
                        <span className="text-sm font-bold text-[var(--foreground)] truncate" title={doc.title}>
                          {doc.title}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <span className="px-2 py-1 rounded-md bg-[var(--secondary)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase border border-[var(--border)]">
                          {doc.source_type || 'OHADA'}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
                          doc.status === 'ready' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : doc.status === 'error' 
                              ? 'bg-red-500/10 text-red-500' 
                              : 'bg-amber-500/10 text-amber-500 animate-pulse'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                             doc.status === 'ready' ? 'bg-emerald-500' : doc.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          {doc.status === 'ready' ? 'Prêt' : doc.status === 'error' ? 'Erreur' : 'Indexation...'}
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                        
                        <button 
                          onClick={() => setDeleteConfirmId(doc.id)}
                          className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] text-center">
              <p className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest">
                Total : {documents.length} document{documents.length > 1 ? 's' : ''} indexé{documents.length > 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Upload Portal */}
      <UploadModal 
        key="index-upload-modal"
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          fetchDocuments();
          if (onRefreshNeeded) onRefreshNeeded();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmModal 
        key="index-delete-confirm"
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Supprimer le document ?"
        message="Cette action est irréversible. Tous les vecteurs et paragraphes associés seront définitivement supprimés et l'IA ne pourra plus y accéder."
        confirmText="Supprimer"
      />
    </>
  );
}
