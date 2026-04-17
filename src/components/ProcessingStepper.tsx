'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export type StepDefinition = {
  id: string;
  label: string;
};

export const STEPS: StepDefinition[] = [
  { id: 'UPLOAD', label: 'Upload du fichier' },
  { id: 'EXTRACTION', label: 'Extraction du texte' },
  { id: 'CHUNKING', label: 'Découpage en sections' },
  { id: 'EMBEDDING', label: 'Génération Ingestion RAG' },
  { id: 'DONE', label: 'Terminé' },
];

export default function ProcessingStepper({ 
  currentStepIndex, 
  error,
  percent
}: { 
  currentStepIndex: number;
  error?: string | null;
  percent?: number;
}) {
  return (
    <div className="w-full bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)] shadow-inner">
      <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest mb-6 opacity-80">État du traitement</h3>
      <div className="space-y-4">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex || currentStepIndex === STEPS.length - 1;
          const isCurrent = idx === currentStepIndex;
          const isError = error && isCurrent;

          return (
            <div key={step.id} className="flex flex-col relative">
              <div className="flex items-center gap-3 relative z-10">
                {isCompleted && !isError ? (
                  <CheckCircle2 className="text-[var(--primary)] w-5 h-5 shrink-0" />
                ) : isCurrent ? (
                  isError ? (
                    <Circle className="text-red-500 w-5 h-5 shrink-0 fill-red-500/20" />
                  ) : (
                    <Loader2 className="text-blue-500 w-5 h-5 shrink-0 animate-spin" />
                  )
                ) : (
                  <Circle className="text-[var(--muted-foreground)] w-5 h-5 shrink-0 opacity-40" />
                )}
                
                <span className={`text-[13px] font-semibold transition-colors ${
                  isCompleted ? 'text-[var(--foreground)]' : isCurrent ? (isError ? 'text-red-500' : 'text-blue-500') : 'text-[var(--muted-foreground)]'
                }`}>
                  {step.label}
                </span>

                {isCurrent && percent !== undefined && step.id === 'EMBEDDING' && (
                  <span className="text-[10px] font-bold text-[var(--primary)] ml-auto bg-[var(--primary)]/10 px-2 py-0.5 rounded-full ring-1 ring-[var(--primary)]/20">
                    {percent}%
                  </span>
                )}
              </div>
              
              {/* Vertical line connector */}
              {idx < STEPS.length - 1 && (
                <div className={`absolute left-[9px] top-5 w-[2px] h-5 transition-colors ${
                  isCompleted ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {error ? (
        <motion.div 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-medium"
        >
          {error}
        </motion.div>
      ) : currentStepIndex === STEPS.length - 1 ? (
        <motion.div 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mt-6 p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl text-xs text-[var(--primary)] font-bold text-center flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          Traitement juridique terminé avec succès !
        </motion.div>
      ) : null}
    </div>
  );
}
