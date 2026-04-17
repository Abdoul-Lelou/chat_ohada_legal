'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ProcessingStepper, { STEPS } from './ProcessingStepper';
import { parseApiError, handleUknownError } from '@/lib/error-parser';

export default function UploadModal({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('OHADA');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Progress states
  const [isUploading, setIsUploading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [percent, setPercent] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Le fichier dépasse 10MB.');
      return;
    }
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace('.pdf', ''));
    }
  };

  const handleProcessStream = async (documentId: string, storagePath: string) => {
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, storagePath })
      });

      if (!res.ok) {
        const friendly = await parseApiError(res);
        throw new Error(friendly.message);
      }
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Impossible d'établir une connexion avec le serveur.");

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventNameRegex = /^event: (.+)\ndata: (.*)$/;
            const match = eventNameRegex.exec(line);
            
            if (match) {
              const eventType = match[1].trim();
              const payload = JSON.parse(match[2].trim());

              if (eventType === 'progress') {
                if (payload.step === 'EXTRACTION') setCurrentStepIndex(1);
                else if (payload.step === 'CHUNKING') setCurrentStepIndex(2);
                else if (payload.step === 'EMBEDDING' || payload.step === 'EMBEDDING_PROGRESS') {
                  setCurrentStepIndex(3);
                  if (payload.percent) setPercent(payload.percent);
                }
              } else if (eventType === 'done') {
                setCurrentStepIndex(4);
                toast.success('Document indexé et prêt pour le chat !');
                if (onSuccess) onSuccess();
              } else if (eventType === 'error') {
                throw new Error(payload.message || "Une erreur est survenue durant l'analyse.");
              }
            }
          }
        }
      }
    } catch (err: any) {
      const friendly = handleUknownError(err);
      setError(friendly.message);
    }
  };

  const handleSubmit = async () => {
    if (!file) return toast.error('Ajoutez un fichier.');
    if (!title.trim()) return toast.error('Veuillez entrer un titre obligatoire.');

    setIsUploading(true);
    setError(null);
    setCurrentStepIndex(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('sourceType', sourceType);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const friendly = await parseApiError(uploadRes);
        throw new Error(friendly.message);
      }

      const uploadData = await uploadRes.json();
      setCurrentStepIndex(1);
      await handleProcessStream(uploadData.documentId, uploadData.storagePath);
      
    } catch (err: any) {
      const friendly = handleUknownError(err);
      setError(friendly.message);
      toast.error(friendly.message);
    }
  };

  const resetAndClose = () => {
    if (isUploading && currentStepIndex !== STEPS.length - 1 && !error) {
       toast.warning("Veuillez patienter pendant l'indexation.");
       return;
    }
    setFile(null);
    setTitle('');
    setIsUploading(false);
    setCurrentStepIndex(0);
    setError(null);
    setPercent(undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Ajouter un document</h2>
              {!isUploading || error || currentStepIndex === STEPS.length - 1 ? (
                <button onClick={resetAndClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1 rounded-md hover:bg-[var(--secondary)]">
                  <X size={20} />
                </button>
              ) : null}
            </div>

            <div className="p-6 overflow-y-auto hide-scrollbar">
              {isUploading ? (
                <ProcessingStepper currentStepIndex={currentStepIndex} error={error} percent={percent} />
              ) : (
                <div className="space-y-6">
                  
                  {/* Title Input */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
                      Titre du document <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Acte uniforme OHADA..."
                      className="w-full bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50 text-sm"
                      required
                    />
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-2 font-medium">Sera utilisé pour le RAG et les citations juridiques.</p>
                  </div>

                  {/* Source Type */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Catégorie</label>
                    <select 
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option value="OHADA">Droit OHADA</option>
                      <option value="CODE_MINIER">Code Minier</option>
                      <option value="AUTRE">Autre source légale</option>
                    </select>
                  </div>

                  {/* Dropzone */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Fichier PDF (Max 10MB)</label>
                    
                    {!file ? (
                      <div 
                        onDragEnter={(e) => { handleDrag(e); setIsDragOver(true); }}
                        onDragOver={handleDrag}
                        onDragLeave={(e) => { handleDrag(e); setIsDragOver(false); }}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isDragOver ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)]'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud size={32} className={isDragOver ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'} />
                        <p className="mt-4 text-[13px] text-[var(--foreground)] font-medium text-center">
                          Glissez votre PDF ici ou <span className="text-[var(--primary)] hover:underline">cliquez</span>.
                        </p>
                        <input 
                          type="file" 
                          accept="application/pdf"
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-[var(--background)] border border-[var(--primary)]/30 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText size={20} className="text-[var(--primary)] shrink-0" />
                          <span className="text-sm font-semibold text-[var(--foreground)] truncate">{file.name}</span>
                        </div>
                        <button onClick={() => setFile(null)} className="p-1.5 hover:text-red-500 text-[var(--muted-foreground)] transition-colors rounded-lg hover:bg-red-500/10 ml-2">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Footer */}
            {!isUploading && (
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={resetAndClose} className="px-5 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                  Annuler
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!file || !title.trim()}
                  className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${
                    file && title.trim() ? 'bg-[var(--primary)] text-white hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-95 cursor-pointer' : 'bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed'
                  }`}
                >
                  Démarrer l'Indexation
                </button>
              </div>
            )}
            {isUploading && (error || currentStepIndex === STEPS.length - 1) && (
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end">
                <button onClick={resetAndClose} className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:shadow-lg active:scale-95 transition-all">
                  {error ? 'Fermer' : 'Terminer'}
                </button>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
